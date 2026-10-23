import postgres from "postgres";

// Supabase pooler (transaction mode) does not support prepared statements.
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", prepare: false });

export async function GET(request: Request) {
  try {
    const response = await sql`SELECT * FROM drivers`;

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
