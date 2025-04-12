const userarr = [];
const sign = (req, res) => {
  console.log("sign");
  const { name, password } = req.body;
  const existing = userarr.find((user) => user.name === name);
  if (existing) return res.status(400).json({ message: " already user" });
  console.log("sign", req.body);
  userarr.push({ name, password });
  return  res.status(200).json({ m: "sign secussfull" });
};

const login = (req, res) => {
  const { name, password } = req.body;
  const existing = userarr.find((user) => user.name === name);

  if (!existing) return res.status(400).json({ message: "no user" });
  if (existing.password !== password)
    return res.status(400).json({ message: "wrong password" });
  req.session.vaild = true;
  console.log(req.body);
  return res.status(200).json({ message: "login successful" });
};

const logout = (req, res) => {
  console.log("logout");
  req.session.destroy();
   return res.status(200).json({ message: "Logged out" });
};

module.exports = { sign, login, logout };
