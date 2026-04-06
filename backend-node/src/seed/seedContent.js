import { connectMongo } from "../config/mongo.js";
import { GemModel } from "../models/Gem.js";
import { AiToolModel } from "../models/AiTool.js";
import { ReviewModel } from "../models/Review.js";
import { PricingModel } from "../models/Pricing.js";
import { gems, aiTools, reviews, pricing } from "./contentData.js";

export async function seedContent() {
  await connectMongo();

  await Promise.all(
    gems.map((item) =>
      GemModel.findOneAndUpdate({ slug: item.slug }, item, { upsert: true, new: true, setDefaultsOnInsert: true })
    )
  );

  await Promise.all(
    aiTools.map((item) =>
      AiToolModel.findOneAndUpdate({ slug: item.slug }, item, { upsert: true, new: true, setDefaultsOnInsert: true })
    )
  );

  await Promise.all(
    reviews.map((item) =>
      ReviewModel.findOneAndUpdate({ slug: item.slug }, item, { upsert: true, new: true, setDefaultsOnInsert: true })
    )
  );

  await PricingModel.findOneAndUpdate({ _id: "000000000000000000000001" }, { ...pricing, _id: "000000000000000000000001" }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedContent()
    .then(() => {
      console.log("Mongo content seeded");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
