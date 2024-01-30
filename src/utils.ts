import queryString from "query-string";

type Params = {
  userId: string;
  name: string;
  email: string;
  phone: string;
}
export const getUrlParams = (req: Request) => {
  const urlParamString = req.url.split("?")[1];
  const params = queryString.parse(urlParamString) as Params;
  const userId = params.userId;
  
  if (!userId) throw new Error("userId is missing");
  
  return {
    ...params,
    userId: Number(userId),
  }
}

