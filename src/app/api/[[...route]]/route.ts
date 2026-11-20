import { NextRequest } from "next/server";
import { getDb } from "@/src/db/client";
import { handle } from "@/server/app";

export const dynamic = "force-dynamic";

async function routeHandler(request: NextRequest) {
  let connection;
  try {
    connection = getDb();
    return await handle(request, connection.db);
  } catch (error) {
    return Response.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function GET(request: NextRequest) {
  return routeHandler(request);
}

export async function POST(request: NextRequest) {
  return routeHandler(request);
}

export async function PATCH(request: NextRequest) {
  return routeHandler(request);
}

export async function DELETE(request: NextRequest) {
  return routeHandler(request);
}

export async function PUT(request: NextRequest) {
  return routeHandler(request);
}
