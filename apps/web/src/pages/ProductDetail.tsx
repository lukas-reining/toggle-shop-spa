import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Suspense } from "react";
import { useCart } from "@/hooks/use-cart";
import { useProduct } from "@/hooks/use-products";

function ProductDetailSkeleton() {
  return (
    <div className="md:flex">
      <div className="md:flex-shrink-0 p-8">
        <div className="w-48 h-48 bg-gray-300 rounded-md animate-pulse" />
      </div>
      <div className="p-8 w-full">
        <div className="h-8 bg-gray-300 rounded w-1/2 mb-2 animate-pulse" />
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2 animate-pulse" />
      </div>
    </div>
  );
}

function ProductDetailContent({ id }: { id: string }) {
  const { addToCart } = useCart();
  const product = useProduct(id);

  if (!product) {
    return <div>Product not found</div>;
  }

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="md:flex">
      <div className="md:flex-shrink-0 p-8">
        <img
          src={product.image}
          alt={product.name}
          width={400}
          height={400}
          className="h-48 w-full object-cover md:w-48 rounded-md"
        />
      </div>
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {product.name}
        </h2>
        <p className="text-gray-600 mb-4">{product.description}</p>
        <p className="text-gray-900 font-bold text-xl mb-4">
          ${product.price.toFixed(2)}
        </p>
        <button
          onClick={handleAddToCart}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <Link
          to="/products"
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <Suspense fallback={<ProductDetailSkeleton />}>
            <ProductDetailContent id={id ?? ""} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
