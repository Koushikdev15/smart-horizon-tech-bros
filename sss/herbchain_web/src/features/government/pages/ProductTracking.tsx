import PageHeader from '../../../components/PageHeader';
import ProductCatalogue from '../../../components/ProductCatalogue';

/**
 * Regulator's view of every finished product on the ledger.
 *
 * Shares the catalogue with the Manufacturer's "Available Products" so the two
 * cannot drift; the regulator's copy additionally shows which manufacturer
 * released each product and how many manufacturers are represented.
 *
 * Batch-level tracing lives on the Batch Timeline page — this one is about what
 * actually reached the shelf.
 */
export default function ProductTracking() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Product Tracking"
        description="Every finished product released across the network, traceable back to its source batches"
      />
      <ProductCatalogue
        showManufacturer
        emptyHint="Products appear here once a manufacturer releases one."
      />
    </div>
  );
}
