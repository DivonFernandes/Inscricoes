# Inscricoes Flask - Final

Projeto com SQLite e autenticação admin.

## Credenciais admin

- rota de login: /admin
- usuário: admin (fixo)
- senha: 123456

## Como rodar

```bash
python -m venv .venv
# Windows
.\.venv\Scripts\activate
pip install -r requirements.txt
set FLASK_APP=app.py
flask initdb
flask run
```

Abra http://127.0.0.1:5000 para cadastrar e /admin para acessar os inscritos.
