import queryString from "query-string";

type Params = {
  userId: string;
  dependentId: string;
  name: string;
  email: string;
  phone: string;
}
export const getUrlParams = (req: Request) => {
  const urlParamString = req.url.split("?")[1];
  const params = queryString.parse(urlParamString) as Params;
  
  return {
    ...params,
    userId: Number(params.userId),
    dependentId: Number(params.dependentId),
  }
}

