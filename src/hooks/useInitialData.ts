export const useInitialDateRange = () => {
  const dateFrom = new Date(Date.now() - 24*60*60*1000).toISOString().split("T")[0];
  const dateTo = new Date().toISOString().split("T")[0];
  return { dateFrom, dateTo } as const;
};

export const useUserInfo = () => {
  const azureUserStr = localStorage.getItem("azureUser");
  const azureUser = azureUserStr ? JSON.parse(azureUserStr) : null;
  return azureUser;
};