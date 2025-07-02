// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripPrivateFields(objectData: any, fieldsToStrip: string[]) {
  const userObject = objectData.toObject();
  fieldsToStrip.forEach((field) => {
    delete userObject[field];
  });

  return userObject;
}
