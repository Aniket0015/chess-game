const userarr = [];
const sign = (req, res) => {
  console.log("sign");
  const { name, password } = req.body;
  const existing = userarr.find((user) => user.name === name);
  if (existing) return res.status(400).json({ message: " already user" });
  console.log("sign", req.body);
  userarr.push({ name, password });
  return   res.redirect("http://localhost:5000/login.html");
};

const login = (req, res) => {
  const { name, password } = req.body;
  const existing = userarr.find((user) => user.name === name);

  if (!existing) return res.redirect("http://localhost:5000/sign.html");
  if (existing.password !== password)
    return res.status(400).json({ message: "wrong password" });
  req.session.valid = true;
  console.log(req.body);
  return res.redirect("/home") ;
};

const logout = (req, res) => {
  console.log("logout");
  req.session.destroy();
  return res.status(200).json({ message: "Logged out" });
};

module.exports = { sign, login, logout };
