import React from 'react';
import gql from 'graphql-tag';
import { useSubscription, useQuery, useMutation } from 'urql';

${jsDoc}

const CREATE_MUTATION = gql`
  mutation Create${CamelClass}Mutation(${createMutationsArgs}) {
    Create${CamelClass}(${createArgs}) {
${fields}
    }
  }
`

export const useCreate${CamelClass} = () => {
  return useMutation(CREATE_MUTATION)
}

const UPDATE_MUTATION = gql`
  mutation Update${CamelClass}Mutation(${updateMutationsArgs}) {
    Update${CamelClass}(${updateArgs}) {
${fields}
    }
  }
`

export const useUpdate${CamelClass} = () => {
  return useMutation(UPDATE_MUTATION)
}


const DELETE_MUTATION = gql`
  mutation Delete${CamelClass}Mutation($id: String) {
    Delete${CamelClass}(id: $id) {
${fields}
    }
  }
`

export const useDelete${CamelClass} = () => {
  return useMutation(DELETE_MUTATION)
}

const SUBSCRIPTION_QUERY = `
subscription{
    ${CamelClass}Changed {
${fields}
    }
  }
`;

export const ${CamelClass}Updaters = {
  ${CamelClass}Changed: (result, _args, cache, _info) => {
    cache.updateQuery({ query: GET_ALL_QUERY }, data => {
      // console.log("${CamelClass}Changed", data.${CamelClass}s)
      if (data.${CamelClass}s.find(c => c.id === result.${CamelClass}Changed.id)) {
        // filter the deleted class events, then remove the newly deleted class event
        let ${CamelClass}s = data.${CamelClass}s.filter(
          (c) =>
            c._deleted_ !== true ||
            (result.${CamelClass}Changed._deleted_ !== true &&
              c.id === result?.${CamelClass}Changed?.id)
        ).map((c) =>
          c.id === result?.${CamelClass}Changed?.id ? result.${CamelClass}Changed : c
        );

        // console.log("${CamelClass}Changed filtered", ${CamelClass}s, result.${CamelClass}Changed._deleted_)
        data.${CamelClass}s = ${CamelClass}s
        return data;
      } else {
        // on create
        data.${CamelClass}s.push(result.${CamelClass}Changed);
        return data;
      }
    });
  },
};

export const useSubscribeTo${CamelClass}s = () => {
  return useSubscription({ query: SUBSCRIPTION_QUERY });
}

const GET_ALL_QUERY = `
query{
    ${CamelClass}s {
${fields}
    }
  }
`;

export const use${CamelClass}s = (where) => {
  return useQuery({
    query: GET_ALL_QUERY,
  });
}

const GET_QUERY = `
query{
    ${CamelClass}(id: $id) {
${fields}
    }
  }
`;

export const use${CamelClass} = (id) => {
  return useQuery({
    query: GET_QUERY,
  });
}

export function ${CamelClass}s(props) {
  const [result, reexecuteQuery] = use${CamelClass}s();
  // eslint-disable-next-line no-unused-vars
  const [res] = useSubscribeTo${CamelClass}s();
  // eslint-disable-next-line no-unused-vars
  const [s, executeCreate] = useCreate${CamelClass}();
  // eslint-disable-next-line no-unused-vars
  const [s1, executeUpdate] = useUpdate${CamelClass}();
  // eslint-disable-next-line no-unused-vars
  const [s2, executeDelete] = useDelete${CamelClass}();

  const create = React.useCallback(
    /** 
     * @param {${CamelClass}} object
     * @returns {Promise<${CamelClass}>}
     * */
    (object) => {
      executeCreate(object);
    },
    [executeCreate]
  );

  const update = React.useCallback(
    /**
     * @param {${CamelClass}} obj
     * @returns {Promise<${CamelClass}>}
     * */
    (obj) => {
      if (obj.id) {
        const primary_key = window.atob(obj.id).split(":")[1];
        executeUpdate({ ...obj, id: primary_key });
      } else {
        executeUpdate(obj);
      }
    },
    [executeUpdate]
  );

  const destroy = React.useCallback(
    /**
     * @param {String} id
     * @returns {Promise<${CamelClass}>}
     * */
    (id) => {
      executeDelete({ id });
    },
    [executeDelete]
  );

  const { data, fetching, error } = result;

  return React.cloneElement(props.children, {
    fetching,
    error,
    data: data?.${CamelClass}s,
    destroy,
    update,
    create,
    refetch: reexecuteQuery
  });
};
