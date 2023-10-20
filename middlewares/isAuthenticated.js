const User = require("../models/User");

const isAuthenthicated = async (req, res, next) => {
  //Si l'en-tête "Authorization" est présent
  if (req.headers.authorization) {
    //on cherche dans la base de donnée si ce token est renseigné
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      req.user = user;
      // On crée une clé "user" dans req. La route dans laquelle le middleware est appelé pourra avoir accès aux informations du user
      return next();
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = isAuthenthicated;
