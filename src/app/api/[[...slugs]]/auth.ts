import { auth } from "@/lib/auth";

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  getPaths: (prefix = "/auth/api") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path];

        for (const method of Object.keys(paths[path])) {
          const operation = (
            reference[key] as Record<string, { tags: string[] }>
          )[method];

          operation.tags = ["Better Auth"];
        }
      }

      return reference;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Promise<any>,
  components: getSchema().then(
    ({ components }) => components,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as Promise<any>,
} as const;
