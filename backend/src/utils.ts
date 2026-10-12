import { prisma } from "./db";

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[\u02bb\u02bc\u2018\u2019\u0027`]/g, "")
    .split("")
    .map((ch) => (CYR[ch] !== undefined ? CYR[ch] : ch))
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

type SlugModel = "category" | "brand" | "product";

export async function uniqueSlug(model: SlugModel, base: string): Promise<string> {
  const root = slugify(base).slice(0, 80);
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await (prisma[model] as any).findUnique({ where: { slug } });
    if (!found) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export function ipOf(req: { ip?: string }): string {
  return req.ip || "unknown";
}
