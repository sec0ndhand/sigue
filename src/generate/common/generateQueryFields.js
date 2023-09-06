function generateQueryFields(type, typesMap) {
    if (type.kind === 'LIST' || type.kind === 'NON_NULL') {
      return generateQueryFields(type.ofType, typesMap);
    }

    if (type.kind !== 'OBJECT' && type.kind !== 'INTERFACE' && type.kind !== 'UNION') {
      return '';
    }

    const fields = typesMap[type.name]?.fields || [];
    let fieldStrings = [];

    for (const field of fields) {
      const fieldType = field.type;
      const subFields = generateQueryFields(fieldType, typesMap);

      if (subFields) {
        fieldStrings.push(`${field.name} {\n${subFields}\n}`);
      } else {
        fieldStrings.push(field.name);
      }
    }

    return fieldStrings.join('\n');
  }

  exports.generateQueryFields = generateQueryFields;
