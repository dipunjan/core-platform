import { SchemaOptions } from 'mongoose';

export function mongooseSchemaOptions(
  hiddenFields: string[] = [],
): SchemaOptions {
  return {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        for (const field of hiddenFields) {
          delete ret[field];
        }
        return ret;
      },
    },
  };
}
