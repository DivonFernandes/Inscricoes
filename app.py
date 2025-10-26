
import os
from datetime import datetime, date
from flask import Flask, render_template, redirect, url_for, flash, request, session
from flask_wtf import FlaskForm
from wtforms import StringField, DateField, SelectField, BooleanField, SubmitField, PasswordField
from wtforms.validators import DataRequired, Length, Regexp, Optional, ValidationError
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash

SECRET_KEY = os.environ.get("SECRET_KEY", "troque_esta_chave_para_producao")
DATABASE_URI = os.environ.get("DATABASE_URI", "sqlite:///inscricoes.db")

app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Admin password hash (pre-configured)
ADMIN_PASSWORD_HASH = "scrypt:32768:8:1$zIN2clngpWiXy2XT$8c2959d1ea31c0cf3909c4bf03a27b3d8593d03b1352fcf63b75f674a888562f0b17e9a1cd8e530ae6bb131b6964e6e64e03ec4205de09b513aebc41bf68e185"

def clean_cpf(value: str) -> str:
    return ''.join([c for c in (value or '') if c.isdigit()])

def valida_cpf_algoritmo(cpf: str) -> bool:
    cpf = clean_cpf(cpf)
    if len(cpf) != 11:
        return False
    if cpf == cpf[0] * 11:
        return False
    def calc_digit(cpf_slice, factor):
        total = 0
        for ch in cpf_slice:
            total += int(ch) * factor
            factor -= 1
        resto = total % 11
        return '0' if resto < 2 else str(11 - resto)
    dig1 = calc_digit(cpf[:9], 10)
    dig2 = calc_digit(cpf[:10], 11)
    return cpf[9] == dig1 and cpf[10] == dig2

def CPFValido(form, field):
    cpf = clean_cpf(field.data)
    if not valida_cpf_algoritmo(cpf):
        raise ValidationError('CPF inválido')

class Inscricao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cpf = db.Column(db.String(11), unique=True, nullable=False, index=True)
    nome = db.Column(db.String(200), nullable=False)
    estado_civil = db.Column(db.String(50), nullable=True)
    sexo = db.Column(db.String(20), nullable=True)
    data_nascimento = db.Column(db.Date, nullable=True)
    endereco = db.Column(db.String(300), nullable=True)
    bairro = db.Column(db.String(150), nullable=True)
    cidade_estado = db.Column(db.String(150), nullable=True)
    telefone = db.Column(db.String(20), nullable=True)
    idade = db.Column(db.Integer, nullable=True)
    chefe_de_equipe = db.Column(db.Boolean, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class InscricaoForm(FlaskForm):
    cpf = StringField('CPF', validators=[DataRequired(), Length(min=11, max=14), Regexp(r'^[0-9\.\-]+$', message='Apenas números, pontos e traços são permitidos'), CPFValido])
    nome = StringField('Nome completo', validators=[DataRequired(), Length(min=2, max=200)])
    estado_civil = SelectField('Estado civil', choices=[('', 'Selecione'), ('solteiro', 'Solteiro(a)'), ('casado', 'Casado(a)'), ('divorciado', 'Divorciado(a)'), ('viuvo', 'Viúvo(a)')], validators=[Optional()])
    sexo = SelectField('Sexo', choices=[('', 'Selecione'), ('masculino', 'Masculino'), ('feminino', 'Feminino'), ('outro', 'Outro')], validators=[Optional()])
    data_nascimento = DateField('Data de nascimento', format='%Y-%m-%d', validators=[Optional()])
    endereco = StringField('Endereço', validators=[Optional(), Length(max=300)])
    bairro = StringField('Bairro', validators=[Optional(), Length(max=150)])
    cidade_estado = StringField('Cidade / Estado', validators=[Optional(), Length(max=150)])
    telefone = StringField('Telefone', validators=[Optional(), Length(max=20)])
    chefe_de_equipe = BooleanField('Chefe de equipe')
    submit = SubmitField('Enviar')

class LoginForm(FlaskForm):
    password = PasswordField('Senha', validators=[DataRequired()])
    submit = SubmitField('Entrar')

@app.cli.command('initdb')
def initdb_command():
    db.create_all()
    print('Banco criado.')

@app.route('/', methods=['GET', 'POST'])
def inscricao():
    form = InscricaoForm()
    if form.validate_on_submit():
        cpf_limpo = clean_cpf(form.cpf.data)
        idade = None
        if form.data_nascimento.data:
            hoje = date.today()
            nasc = form.data_nascimento.data
            idade = hoje.year - nasc.year - ((hoje.month, hoje.day) < (nasc.month, nasc.day))
        inscr = Inscricao(
            cpf=cpf_limpo,
            nome=form.nome.data.strip(),
            estado_civil=form.estado_civil.data or None,
            sexo=form.sexo.data or None,
            data_nascimento=form.data_nascimento.data,
            endereco=form.endereco.data,
            bairro=form.bairro.data,
            cidade_estado=form.cidade_estado.data,
            telefone=form.telefone.data,
            idade=idade,
            chefe_de_equipe=bool(form.chefe_de_equipe.data)
        )
        try:
            db.session.add(inscr)
            db.session.commit()
            flash('Inscrição cadastrada com sucesso!', 'success')
            return redirect(url_for('inscricao'))
        except IntegrityError:
            db.session.rollback()
            flash('CPF já cadastrado.', 'warning')
        except Exception as ex:
            db.session.rollback()
            flash('Erro ao salvar: {{}}'.format(ex), 'danger')
    return render_template('inscricao_form.html', form=form)

@app.route('/admin', methods=['GET', 'POST'])
def admin_login():
    if session.get('admin'):
        return redirect(url_for('inscritos'))
    form = LoginForm()
    if form.validate_on_submit():
        if check_password_hash(ADMIN_PASSWORD_HASH, form.password.data):
            session['admin'] = True
            flash('Login efetuado.', 'success')
            return redirect(url_for('inscritos'))
        flash('Senha incorreta.', 'danger')
    return render_template('admin_login.html', form=form)

@app.route('/logout')
def logout():
    session.pop('admin', None)
    flash('Desconectado.', 'info')
    return redirect(url_for('inscricao'))

@app.route('/inscritos')
def inscritos():
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    registros = Inscricao.query.order_by(Inscricao.created_at.desc()).all()
    return render_template('lista.html', registros=registros)

if __name__ == '__main__':
    # Cria DB sqlite automaticamente em dev
    if DATABASE_URI.startswith('sqlite') and not os.path.exists('inscricoes.db'):
        db.create_all()
    app.run(debug=True)
