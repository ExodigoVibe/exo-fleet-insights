export const useInitialDateRange = () => {
  const now = new Date();

  // first day of last month (local time)
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const dateFrom = firstDayLastMonth.toISOString().split("T")[0];
  const dateTo = now.toISOString().split("T")[0];

  return { dateFrom, dateTo } as const;
};

export const useUserInfo = () => {
  const azureUserStr = localStorage.getItem("azureUser");
  const azureUser = azureUserStr ? JSON.parse(azureUserStr) : null;
  return azureUser;
};