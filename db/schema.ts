import { pgTable, serial, text, varchar, date, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const inscricoes = pgTable("inscricoes", {
  id: serial().primaryKey(),
  cpf: varchar({ length: 11 }).notNull().unique(),
  nome: text().notNull(),
  estadoCivil: text("estado_civil"),
  sexo: text(),
  dataNascimento: date("data_nascimento"),
  endereco: text(),
  bairro: text(),
  cidadeEstado: text("cidade_estado"),
  telefone: text(),
  idade: integer(),
  chefeDeEquipe: boolean("chefe_de_equipe").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
