import PageHeader from '../../../components/PageHeader';
import ProductCatalogue from '../../../components/ProductCatalogue';

/**
 * Finished products released from this unit.
 *
 * Shares the catalogue with the Government's "Product Tracking" so the two
 * views stay identical; the regulator's copy adds the manufacturer column.
 */
export default function AvailableProducts() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Available Products"
        description="Finished products released from this unit, with their traceability codes"
      />
      <ProductCatalogue emptyHint="Formulate one in Create Product." />
    </div>
  );
}
