import { z } from "zod"

/**A deliberately trivial schema whose only job is proving the codegen pipeline (JSON Schema -> Zod + Pydantic) works end-to-end before the real, harder schemas (good-law-status, citation, authority-identity) are built on top of it. Not consumed by any repo.*/
export const TrivialPingSchema = z.object({ 
/**An arbitrary text payload.*/
"message": z.string().describe("An arbitrary text payload."), 
/**An arbitrary integer payload.*/
"count": z.number().int().describe("An arbitrary integer payload.") }).strict().describe("A deliberately trivial schema whose only job is proving the codegen pipeline (JSON Schema -> Zod + Pydantic) works end-to-end before the real, harder schemas (good-law-status, citation, authority-identity) are built on top of it. Not consumed by any repo.")
export type TrivialPing = z.infer<typeof TrivialPingSchema>
