/**
 * Central Pricing Utility for PrintVault
 * 
 * NOTE: These are SAMPLE DEMO rates for demonstration purposes,
 * not verified commercial rates for Sai Xerox.
 */

export type PaperSize = 'A4' | 'A3';
export type PrintSide = 'single' | 'double';
export type BindingOption = 'none' | 'stapling' | 'spiral';
export type ColorMode = 'bw' | 'color';

export interface RateCard {
  a4BwPerSide: number;
  a4ColorPerSide: number;
  a3BwPerSide: number;
  a3ColorPerSide: number;
  staplingCost: number;
  spiralCost: number;
}

export const DEMO_RATES: RateCard = {
  a4BwPerSide: 2, // ₹2 per printed side
  a4ColorPerSide: 10, // ₹10 per printed side
  a3BwPerSide: 5, // ₹5 per printed side
  a3ColorPerSide: 20, // ₹20 per printed side
  staplingCost: 5, // ₹5 per order
  spiralCost: 30, // ₹30 per order
};

export interface PricingInput {
  pageCount: number;
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  printSide: PrintSide;
  binding?: BindingOption;
  fileName?: string;
}

export interface PricingBreakdown {
  fileName: string;
  pageCount: number;
  copies: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  printSide: PrintSide;
  binding: BindingOption;
  perSideRate: number;
  physicalSheets: number;
  printingTotal: number;
  bindingTotal: number;
  grandTotal: number;
  calculationLines: string[];
  isDemoSamplePrice: true;
}

/**
 * Calculates print pricing transparently based on sides, sheets, copies, and finishing.
 */
export function calculatePrintPrice(input: PricingInput): PricingBreakdown {
  const {
    pageCount,
    copies = 1,
    colorMode,
    paperSize = 'A4',
    printSide = 'single',
    binding = 'none',
    fileName = 'document.pdf',
  } = input;

  const validPages = Math.max(1, Math.floor(pageCount || 1));
  const validCopies = Math.max(1, Math.min(100, Math.floor(copies || 1)));

  // Determine per-side rate
  let perSideRate = DEMO_RATES.a4BwPerSide;
  if (paperSize === 'A4') {
    perSideRate = colorMode === 'bw' ? DEMO_RATES.a4BwPerSide : DEMO_RATES.a4ColorPerSide;
  } else {
    // A3
    perSideRate = colorMode === 'bw' ? DEMO_RATES.a3BwPerSide : DEMO_RATES.a3ColorPerSide;
  }

  // Double-sided physical sheets calculation
  const physicalSheets =
    printSide === 'double' ? Math.ceil(validPages / 2) * validCopies : validPages * validCopies;

  // Printing cost = total printed sides * rate
  // Each selected page is 1 printed side
  const printingTotal = validPages * validCopies * perSideRate;

  // Finishing cost
  let bindingTotal = 0;
  if (binding === 'stapling') {
    bindingTotal = DEMO_RATES.staplingCost;
  } else if (binding === 'spiral') {
    bindingTotal = DEMO_RATES.spiralCost;
  }

  const grandTotal = printingTotal + bindingTotal;

  const colorLabel = colorMode === 'bw' ? 'Black & White' : 'Full Colour';
  const sideLabel = printSide === 'double' ? 'Double-sided (Duplex)' : 'Single-sided';
  const bindingLabel =
    binding === 'stapling'
      ? 'Stapling (₹5)'
      : binding === 'spiral'
      ? 'Spiral Binding (₹30)'
      : 'None (₹0)';

  const calculationLines = [
    `Document: ${fileName}`,
    `Pages: ${validPages}`,
    `Copies: ${validCopies}`,
    `Paper: ${paperSize} (${colorLabel})`,
    `Side: ${sideLabel} (${physicalSheets} paper sheet${physicalSheets > 1 ? 's' : ''})`,
    `Rate: ₹${perSideRate} per printed side`,
    `Printing: ${validPages} × ${validCopies} × ₹${perSideRate} = ₹${printingTotal}`,
    `Finishing: ${bindingLabel}`,
    `Total: ₹${grandTotal}`,
  ];

  return {
    fileName,
    pageCount: validPages,
    copies: validCopies,
    colorMode,
    paperSize,
    printSide,
    binding,
    perSideRate,
    physicalSheets,
    printingTotal,
    bindingTotal,
    grandTotal,
    calculationLines,
    isDemoSamplePrice: true,
  };
}

export interface PageRangeValidationResult {
  valid: boolean;
  pageCount: number;
  pages: number[];
  error?: string;
  formattedRange?: string;
}

/**
 * Validates and parses page range strings such as "1-4, 7, 9-10" or "all".
 * Ensures all requested pages fall within 1..totalDocPages.
 */
export function validateAndParsePageRange(
  inputStr: string,
  totalDocPages: number
): PageRangeValidationResult {
  const trimmed = inputStr.trim().toLowerCase();

  if (trimmed === 'all' || trimmed === '*' || trimmed === '') {
    const allPages = Array.from({ length: totalDocPages }, (_, i) => i + 1);
    return {
      valid: true,
      pageCount: totalDocPages,
      pages: allPages,
      formattedRange: `All pages (1-${totalDocPages})`,
    };
  }

  // Match comma-separated list of single pages or ranges
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return {
      valid: false,
      pageCount: 0,
      pages: [],
      error: 'Please enter a valid page range (e.g., 1-4, 7, 9-10) or "all".',
    };
  }

  const selectedPagesSet = new Set<number>();

  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const pageNum = parseInt(part, 10);
      if (pageNum < 1) {
        return {
          valid: false,
          pageCount: 0,
          pages: [],
          error: `Page number ${pageNum} is invalid. Page numbers start at 1.`,
        };
      }
      if (pageNum > totalDocPages) {
        return {
          valid: false,
          pageCount: 0,
          pages: [],
          error: `Page ${pageNum} exceeds the confirmed document length of ${totalDocPages} page${
            totalDocPages > 1 ? 's' : ''
          }.`,
        };
      }
      selectedPagesSet.add(pageNum);
    } else if (/^\d+\s*-\s*\d+$/.test(part)) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (start < 1) {
        return {
          valid: false,
          pageCount: 0,
          pages: [],
          error: `Range start ${start} is invalid. Page numbers start at 1.`,
        };
      }
      if (start > end) {
        return {
          valid: false,
          pageCount: 0,
          pages: [],
          error: `Invalid range "${part}": start page (${start}) cannot be greater than end page (${end}).`,
        };
      }
      if (end > totalDocPages) {
        return {
          valid: false,
          pageCount: 0,
          pages: [],
          error: `Range "${part}" exceeds document length of ${totalDocPages} page${
            totalDocPages > 1 ? 's' : ''
          }.`,
        };
      }

      for (let p = start; p <= end; p++) {
        selectedPagesSet.add(p);
      }
    } else {
      return {
        valid: false,
        pageCount: 0,
        pages: [],
        error: `Could not understand "${part}". Use syntax like "1-4, 7, 9-10" or "all".`,
      };
    }
  }

  const sortedPages = Array.from(selectedPagesSet).sort((a, b) => a - b);
  if (sortedPages.length === 0) {
    return {
      valid: false,
      pageCount: 0,
      pages: [],
      error: 'No valid pages found in the requested range.',
    };
  }

  return {
    valid: true,
    pageCount: sortedPages.length,
    pages: sortedPages,
    formattedRange: `${sortedPages.length} page${sortedPages.length > 1 ? 's' : ''} (${sortedPages.join(', ')})`,
  };
}
