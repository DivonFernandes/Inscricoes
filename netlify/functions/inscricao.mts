import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { inscricoes } from "../../db/schema.js";
import { cleanCpf, isValidCpf } from "../../lib/cpf.js";

const ESTADO_CIVIL_OPTIONS = new Set(["solteiro", "casado", "divorciado", "viuvo"]);
const SEXO_OPTIONS = new Set(["masculino", "feminino", "outro"]);

function calcIdade(nascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear();
  const aniversarioAindaNaoChegou =
    hoje.getUTCMonth() < nascimento.getUTCMonth() ||
    (hoje.getUTCMonth() === nascimento.getUTCMonth() && hoje.getUTCDate() < nascimento.getUTCDate());
  if (aniversarioAindaNaoChegou) idade -= 1;
  return idade;
}

function redirectTo(path: string, params: Record<string, string> = {}): Response {
  const search = new URLSearchParams(params).toString();
  return new Response(null, {
    status: 303,
    headers: { Location: search ? `${path}?${search}` : path },
  });
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const form = await req.formData();
  const get = (key: string) => (form.get(key) ?? "").toString().trim();

  const cpfRaw = get("cpf");
  const nome = get("nome");
  const estadoCivil = get("estado_civil");
  const sexo = get("sexo");
  const dataNascimentoRaw = get("data_nascimento");
  const endereco = get("endereco");
  const bairro = get("bairro");
  const cidadeEstado = get("cidade_estado");
  const telefone = get("telefone");
  const chefeDeEquipe = form.get("chefe_de_equipe") != null;

  const fieldEcho: Record<string, string> = {
    cpf: cpfRaw,
    nome,
    estado_civil: estadoCivil,
    sexo,
    data_nascimento: dataNascimentoRaw,
    endereco,
    bairro,
    cidade_estado: cidadeEstado,
    telefone,
  };
  if (chefeDeEquipe) fieldEcho.chefe_de_equipe = "on";

  const errors: string[] = [];
  const cpfLimpo = cleanCpf(cpfRaw);
  if (!cpfRaw || !/^[0-9.\-]+$/.test(cpfRaw)) {
    errors.push("CPF: apenas números, pontos e traços são permitidos.");
  } else if (!isValidCpf(cpfLimpo)) {
    errors.push("CPF inválido.");
  }

  if (!nome || nome.length < 2 || nome.length > 200) {
    errors.push("Nome completo é obrigatório (2-200 caracteres).");
  }

  if (estadoCivil && !ESTADO_CIVIL_OPTIONS.has(estadoCivil)) errors.push("Estado civil inválido.");
  if (sexo && !SEXO_OPTIONS.has(sexo)) errors.push("Sexo inválido.");

  let dataNascimento: Date | null = null;
  if (dataNascimentoRaw) {
    const parsed = new Date(`${dataNascimentoRaw}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      errors.push("Data de nascimento inválida.");
    } else {
      dataNascimento = parsed;
    }
  }

  if (endereco.length > 300) errors.push("Endereço muito longo.");
  if (bairro.length > 150) errors.push("Bairro muito longo.");
  if (cidadeEstado.length > 150) errors.push("Cidade / Estado muito longo.");
  if (telefone.length > 20) errors.push("Telefone muito longo.");

  if (errors.length > 0) {
    return redirectTo("/", { ...fieldEcho, status: "error", message: errors.join(" ") });
  }

  const idade = dataNascimento ? calcIdade(dataNascimento) : null;

  try {
    await db.insert(inscricoes).values({
      cpf: cpfLimpo,
      nome,
      estadoCivil: estadoCivil || null,
      sexo: sexo || null,
      dataNascimento: dataNascimentoRaw || null,
      endereco: endereco || null,
      bairro: bairro || null,
      cidadeEstado: cidadeEstado || null,
      telefone: telefone || null,
      idade,
      chefeDeEquipe,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "23505") {
      return redirectTo("/", { ...fieldEcho, status: "duplicate" });
    }
    console.error("Erro ao salvar inscrição", err);
    return redirectTo("/", { ...fieldEcho, status: "error", message: "Erro ao salvar. Tente novamente." });
  }

  return redirectTo("/", { status: "success" });
};

export const config: Config = {
  path: "/api/inscricao",
  method: "POST",
};
