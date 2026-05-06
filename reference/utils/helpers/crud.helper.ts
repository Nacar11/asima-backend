export const getUpdatedData = (
  originalData: Record<string, any>,
  newData: Record<string, any>,
  fields: string[],
) => {
  const updatedData: Record<string, any> = {};
  fields.forEach((field) => {
    if (newData[field] === undefined) return;

    if (newData[field]?.id || originalData[field]?.id) {
      if (newData[field]?.id !== originalData[field]?.id) {
        updatedData[field] = newData[field];
      }
    } else if (Array.isArray(newData[field])) {
      if (
        !(
          newData[field].length === originalData[field].length &&
          newData[field].every(
            (value, index) => value === originalData[field][index],
          )
        )
      ) {
        if (typeof newData[field] === 'object') {
          if (
            JSON.stringify(newData[field]) !==
            JSON.stringify(originalData[field])
          ) {
            updatedData[field] = newData[field];
          }
        } else {
          updatedData[field] = newData[field];
        }
      }
    } else if (typeof newData[field] === 'object') {
      if (
        JSON.stringify(newData[field]) !== JSON.stringify(originalData[field])
      ) {
        updatedData[field] = newData[field];
      }
    } else if (newData[field] !== originalData[field]) {
      updatedData[field] = newData[field];
    }
  });
  return updatedData;
};
