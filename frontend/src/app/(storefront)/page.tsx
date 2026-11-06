import { Container } from "@/components/ui";
import {
  CategoryCard,
  HomeHero,
  OfferBanner,
  ProductCard,
  SectionHeading,
  ServiceStrip,
} from "@/features/home/components";
import { homeCategories, previewProducts } from "@/features/home/data";

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <Container className="space-y-12 pb-14 sm:space-y-16 sm:pb-20">
        <section aria-labelledby="category-heading">
          <div id="category-heading">
            <SectionHeading
              title="Shop by Category"
              actionLabel="View All Categories"
              actionHref="/categories"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {homeCategories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        </section>

        <OfferBanner />

        <section aria-labelledby="best-sellers-heading">
          <div id="best-sellers-heading">
            <SectionHeading
              title="Best Sellers"
              actionLabel="View All Products"
              actionHref="/products"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {previewProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </section>

        <ServiceStrip />
      </Container>
    </>
  );
}
