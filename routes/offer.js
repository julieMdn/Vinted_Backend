const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const convertToBase64 = require("../utils/convertToBase64");
const isAuthenthicated = require("../middlewares/isAuthenticated");

router.post(
  "/offer/publish",
  fileUpload(),
  isAuthenthicated,
  async (req, res) => {
    try {
      // Je destructure les clefs suivantes de l'objet req.body
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // Je stocke la clef picture de req.body dans une variable picture
      const picture = req.files.picture;
      // Je converti l'image en quelquechose de lisible par cloudinary
      const readablePicture = convertToBase64(picture);

      // J'envoie l'image sur cloudinary et je récupère la réponse
      const result = await cloudinary.uploader.upload(readablePicture);

      // Je crée mon offre
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        product_image: result,
        owner: req.user,
      });

      // Je sauvegarde mon offre
      await newOffer.save();
      //   await newOffer.populate("owner", "account _id");
      // Je répond
      res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    // Je crée un objet que je donerai en argument au find
    const filter = {};

    // En fonction des queries que je reçois, je vais modifier mon objet filter
    if (title) {
      filter.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filter.product_price = {
        $gte: priceMin,
      };
    }

    if (priceMax) {
      // Si la clef product_price existe déjà, je ne l'écrase pas, je lui rajoute juste une clef
      if (filter.product_price) {
        filter.product_price.$lte = priceMax;
      } else {
        filter.product_price = {
          $lte: priceMax,
        };
      }
    }

    // Je crée un objet que je donerai en argument à sort
    const sortFilter = {};

    // En fonction des queries reçus, je construit mon objet
    if (sort === "price-desc") {
      sortFilter.product_price = "desc";
    } else if (sort === "price-asc") {
      sortFilter.product_price = "asc";
    }

    // 5 résultats par page : 1 skip = 0 ---- 2 skip = 5  ----- 3 skip = 10 ---- 4 skip = 15
    // 3 résultats par page : 1 skip = 0 ---- 2 skip = 3  ----- 3 skip = 6

    // skip = (n°page - 1) * nb de résultats par page

    let pageToSend = 1;
    if (page) {
      pageToSend = page;
    }

    // Je calcule skip en fonction du query page que j'ai reçu
    const skip = (pageToSend - 1) * 5; // 5 * pageToSend -5
    console.log(skip);

    // Je vais chercher mes offres
    const offers = await Offer.find(filter)
      .sort(sortFilter)
      .limit(5)
      .skip(skip)
      .select("product_name product_price");

    // Je regarde combien d'offres corespondent à mes recherches
    const numberOfOffers = await Offer.countDocuments(filter);

    res.json({ count: numberOfOffers, offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account _id"
    );
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
