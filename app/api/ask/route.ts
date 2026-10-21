import { NextResponse, type NextRequest } from "next/server";
import { answerQuestion } from "@/lib/assistant";

export async function POST(request: NextRequest) {
  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    if (typeof body.question === "string") question = body.question.trim().slice(0, 300);
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "سؤال خالی است." }, { status: 400 });
  }

  return NextResponse.json(answerQuestion(question));
}
