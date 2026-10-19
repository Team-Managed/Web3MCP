import schema from "../../../../../../protocol/schema/config.schema.json";

export function GET() {
  return Response.json(schema);
}
