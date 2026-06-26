import Image from "next/image";

export function ShopShowcase() {
  return (
    <div className="shop-showcase">
      <div className="shop-showcase__copy">
        <p className="trapman-kicker">Shop and inventory</p>
        <h2>Game economy, shown as evidence.</h2>
        <p>
          Shop, music, and item surfaces are presented as framed product
          evidence while the surrounding page art remains original to the web.
        </p>
      </div>
      <div className="shop-showcase__stage">
        <Image
          src="/assets/generated/trapman/portal.webp"
          alt=""
          width={1200}
          height={1200}
          sizes="(max-width: 900px) 90vw, 32vw"
          className="shop-showcase__portal"
        />
        <Image
          src="/assets/trapman/screens/shop.png"
          alt="TrapMan shop screen showing remove ads, characters, music, and item cards."
          width={390}
          height={844}
          sizes="(max-width: 900px) 58vw, 17rem"
          className="shop-showcase__screen"
        />
      </div>
    </div>
  );
}
