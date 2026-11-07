export function normalizedUsername(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US");
}
export async function findAccount(store, username) {
  const key = normalizedUsername(username);
  const matches = (await store.list()).filter(
    (a) => normalizedUsername(a.name) === key,
  );
  if (!key || matches.length !== 1) throw Error("用户名或密码错误");
  return matches[0];
}
export async function registerAccount(store, username, password) {
  const display = String(username ?? "")
    .normalize("NFKC")
    .trim();
  if (!/^[\p{L}\p{N}_.-]{2,40}$/u.test(display))
    throw Error("用户名需为2至40个汉字、字母、数字或 _ . -");
  return store.serial("account-registration", async () => {
    if (
      (await store.list()).some(
        (a) => normalizedUsername(a.name) === normalizedUsername(display),
      )
    )
      throw Error("用户名已存在");
    return store.create(display, password);
  });
}
