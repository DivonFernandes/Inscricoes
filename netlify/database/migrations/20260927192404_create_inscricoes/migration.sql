CREATE TABLE "inscricoes" (
	"id" serial PRIMARY KEY,
	"cpf" varchar(11) NOT NULL UNIQUE,
	"nome" text NOT NULL,
	"estado_civil" text,
	"sexo" text,
	"data_nascimento" date,
	"endereco" text,
	"bairro" text,
	"cidade_estado" text,
	"telefone" text,
	"idade" integer,
	"chefe_de_equipe" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
