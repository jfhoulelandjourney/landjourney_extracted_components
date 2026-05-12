export type KeyValuePair = {
  key: string;
  value: unknown;
};

export type KeyValueRecord = {
  data: {
    id: string;
    data: {
      user_id: string;
      value: string;
    };
  }[];
};

export type KeyValueRecordSingle = {
  data: {
    id: string;
    data: {
      user_id: string;
      value: string;
    };
  };
};
