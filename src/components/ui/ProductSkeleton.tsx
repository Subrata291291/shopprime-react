type Props = {
  listView?: boolean;
};

export default function ProductSkeleton({ listView = false }: Props) {
  if (listView) {
    return (
      <article className="product-card-list skeleton-list">
        <div className="skeleton-img" style={{ width: 120, height: 120, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-line" style={{ width: '60%', height: 16, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: '40%', height: 14, marginBottom: 12 }} />
          <div className="skeleton-price" style={{ width: '30%', height: 18 }} />
        </div>
      </article>
    );
  }

  return (
    <article className="product-card skeleton-card">
      <div className="product-image">
        <div className="skeleton-img" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="product-content">
        <div className="skeleton-line" style={{ width: '70%', height: 16, marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: '50%', height: 14, marginBottom: 12 }} />
        <div className="skeleton-price" style={{ width: '40%', height: 18 }} />
      </div>
    </article>
  );
}
