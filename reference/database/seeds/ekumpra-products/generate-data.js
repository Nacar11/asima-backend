const fs = require('fs');
const path = require('path');

const productsData = {
  Powder: {
    category: 'POWDER',
    variants: [
      {
        sku: 'PW-CAFMOC',
        name: 'Powder Cafe Mocha',
        cost: 210.0,
        selling: 327.89,
        attrs: { Flavor: 'Cafe Mocha', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-CARAML',
        name: 'Powder Caramel',
        cost: 173.0,
        selling: 268.27,
        attrs: { Flavor: 'Caramel', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-COOCRE',
        name: 'Powder Cookies and Cream',
        cost: 187.0,
        selling: 253.0,
        attrs: { Flavor: 'Cookies and Cream', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-CRMCHE',
        name: 'Powder Cream Cheese',
        cost: 310.0,
        selling: 427.0,
        attrs: { Flavor: 'Cream Cheese', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-CREMLK',
        name: 'Powder Creamy milk',
        cost: 165.0,
        selling: 244.4,
        attrs: { Flavor: 'Creamy Milk', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-CUMBERLEMNADE',
        name: 'Powder Cucumber Lemonade',
        cost: 1011.0,
        selling: 1075.0,
        attrs: { Flavor: 'Cucumber Lemonade', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-DRKCHO',
        name: 'Powder Dark Chocolate',
        cost: 222.0,
        selling: 379.07,
        attrs: { Flavor: 'Dark Chocolate', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-HOKKDO',
        name: 'Powder Hokkaido',
        cost: 212.0,
        selling: 284.97,
        attrs: { Flavor: 'Hokkaido', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-MANGO',
        name: 'Powder Mango',
        cost: 167.0,
        selling: 207.0,
        attrs: { Flavor: 'Mango', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-MNGYOG',
        name: 'Powder Mango Yogurt',
        cost: 522.0,
        selling: 630.0,
        attrs: { Flavor: 'Mango Yogurt', Weight: '1.5kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-MATCHA',
        name: 'Powder Matcha',
        cost: 244.0,
        selling: 345.97,
        attrs: { Flavor: 'Matcha', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-MLKTEA',
        name: 'Powder Milktea',
        cost: 185.0,
        selling: 249.1,
        attrs: { Flavor: 'Milktea', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-OKINWA',
        name: 'Powder Okinawa',
        cost: 217.0,
        selling: 299.46,
        attrs: { Flavor: 'Okinawa', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-RDVELV',
        name: 'Powder Red Velvet',
        cost: 189.0,
        selling: 260.82,
        attrs: { Flavor: 'Red Velvet', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-STWBRY',
        name: 'Powder Strawberry',
        cost: 167.0,
        selling: 245.64,
        attrs: { Flavor: 'Strawberry', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-SBRYYOG',
        name: 'Powder Strawberry Yogurt',
        cost: 532.0,
        selling: 630.0,
        attrs: { Flavor: 'Strawberry Yogurt', Weight: '1.5kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-TABLYA',
        name: 'Powder Tableya',
        cost: 210.0,
        selling: 348.43,
        attrs: { Flavor: 'Tableya', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-UBETAR',
        name: 'Powder Ube Taro',
        cost: 170.0,
        selling: 234.06,
        attrs: { Flavor: 'Ube Taro', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-VANILA',
        name: 'Powder Vanilla',
        cost: 170.0,
        selling: 230.0,
        attrs: { Flavor: 'Vanilla', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-WHPCRE',
        name: 'Powder Whipped Cream',
        cost: 162.0,
        selling: 197.8,
        attrs: { Flavor: 'Whipped Cream', Weight: '500g', UOM: 'Kg' },
      },
      {
        sku: 'PW-WHTCHO',
        name: 'Powder White Chocolate',
        cost: 208.0,
        selling: 248.4,
        attrs: { Flavor: 'White Chocolate', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-WINMLN',
        name: 'Powder Wintermelon',
        cost: 236.0,
        selling: 299.0,
        attrs: { Flavor: 'Wintermelon', Weight: '1kg', UOM: 'Kg' },
      },
      {
        sku: 'PW-PLNYOG',
        name: 'Powder Yogurt Plain',
        cost: 643.0,
        selling: 700.0,
        attrs: { Flavor: 'Yogurt Plain', Weight: '1.5kg', UOM: 'Kg' },
      },
    ],
  },
  'Cup Paper': {
    category: 'PAPER PRODUCT',
    variants: [
      {
        sku: 'PR-CPBLKPN-12',
        name: 'Cup Paper DW Black 12OZ-Plain 25pcs',
        cost: 200.0,
        selling: 300.0,
        attrs: {
          Color: 'Black',
          Volume: '12OZ',
          Style: 'Plain',
          Quantity: '25pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PR-CUPPAPECAT-16',
        name: 'Cup Paper DW Black 16OZ-Everyday 25 pcs',
        cost: 200.0,
        selling: 250.0,
        attrs: {
          Color: 'Black',
          Volume: '16OZ',
          Style: 'Everyday',
          Quantity: '25pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PR-CPBLKPN-16',
        name: 'Cup Paper DW Black 16OZ-Plain 25pcs',
        cost: 122.5,
        selling: 155.0,
        attrs: {
          Color: 'Black',
          Volume: '16OZ',
          Style: 'Plain',
          Quantity: '25pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PR-UBCPBLK-16',
        name: 'Cup Paper DW Black 16OZ-UB 25pcs',
        cost: 122.5,
        selling: 162.5,
        attrs: {
          Color: 'Black',
          Volume: '16OZ',
          Style: 'UB',
          Quantity: '25pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PR-CPBBLKPN-8',
        name: 'Cup Paper DW Black 8OZ-Plain 25pcs',
        cost: 175.0,
        selling: 250.0,
        attrs: {
          Color: 'Black',
          Volume: '8OZ',
          Style: 'Plain',
          Quantity: '25pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PR-CUPPAPECAT-12',
        name: 'Cup Paper DW Black W/ LIDS 12OZ-Everyday 50pcs',
        cost: 460.5,
        selling: 575.0,
        attrs: {
          Color: 'Black',
          Volume: '12OZ',
          Style: 'Everyday with Lids',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PR-CUPPAPECAT-8',
        name: 'Cup Paper DW Black W/LIDS 8OZ-Everyday 50pcs',
        cost: 412.0,
        selling: 500.0,
        attrs: {
          Color: 'Black',
          Volume: '8OZ',
          Style: 'Everyday with Lids',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PR-CPPERWHI-16',
        name: 'Cup Paper White 16OZ-Plain 50 pcs',
        cost: 82.5,
        selling: 155.0,
        attrs: {
          Color: 'White',
          Volume: '16OZ',
          Style: 'Plain',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PR-CPPERWHI-22',
        name: 'Cup Paper White 22OZ-Plain 50 pcs',
        cost: 156.0,
        selling: 260.0,
        attrs: {
          Color: 'White',
          Volume: '22OZ',
          Style: 'Plain',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
    ],
  },
  'Cup PET': {
    category: 'PLASTIC PRODUCT',
    variants: [
      {
        sku: 'PL-CUPPETSCC-8',
        name: 'Cup-Pet Cone Shape Sundae 8oz-SCC 50pcs',
        cost: 65.0,
        selling: 149.5,
        attrs: {
          Shape: 'Cone',
          Volume: '8oz',
          Style: 'SCC',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-CUPPETUB-8',
        name: 'Cup-PET Sundae 9oz-UB',
        cost: 65.0,
        selling: 149.5,
        attrs: {
          Shape: 'Sundae',
          Volume: '9oz',
          Style: 'UB',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-CUPPETUB-1L',
        name: 'Cup PET 1L-UB 25 pcs',
        cost: 115.0,
        selling: 175.0,
        attrs: { Volume: '1L', Style: 'UB', Quantity: '25pcs', UOM: 'Pack' },
      },
      {
        sku: 'PL-CUPPETUB-22',
        name: 'Cup PET 22OZ-UB 50 pcs',
        cost: 110.0,
        selling: 232.5,
        attrs: { Volume: '22OZ', Style: 'UB', Quantity: '50pcs', UOM: 'Pack' },
      },
      {
        sku: 'PL-CUPPETUB-16',
        name: 'Cup PET 16OZ-UB 50 pcs',
        cost: 95.0,
        selling: 199.5,
        attrs: { Volume: '16OZ', Style: 'UB', Quantity: '50pcs', UOM: 'Pack' },
      },
      {
        sku: 'PL-CUPPETSCC-1L',
        name: 'Cup PET 1L-SCC 25 pcs',
        cost: 115.0,
        selling: 175.0,
        attrs: { Volume: '1L', Style: 'SCC', Quantity: '25pcs', UOM: 'Pack' },
      },
      {
        sku: 'PL-CUPPETECAT-22',
        name: 'Cup PET 22OZ-EVERYDAY 50 pcs',
        cost: 197.5,
        selling: 225.0,
        attrs: {
          Volume: '22OZ',
          Style: 'Everyday',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-CUPPETSCC-22',
        name: 'Cup PET 22OZ-SCC 50 pcs',
        cost: 110.0,
        selling: 232.5,
        attrs: { Volume: '22OZ', Style: 'SCC', Quantity: '50pcs', UOM: 'Pack' },
      },
      {
        sku: 'PL-CUPPETECAT-16',
        name: 'Cup PET 16OZ-EVERYDAY 50pcs',
        cost: 175.0,
        selling: 215.0,
        attrs: {
          Volume: '16OZ',
          Style: 'Everyday',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-CUPPETSCC-16',
        name: 'Cup PET 16OZ-SCC 50 pcs',
        cost: 95.0,
        selling: 199.5,
        attrs: { Volume: '16OZ', Style: 'SCC', Quantity: '50pcs', UOM: 'Pack' },
      },
    ],
  },
  'Lid Flat': {
    category: 'PLASTIC PRODUCT',
    variants: [
      {
        sku: 'PL-LDFLT1L-50',
        name: 'Lid Flat 1L 50pcs',
        cost: 65.0,
        selling: 100.0,
        attrs: { Size: '1L', Quantity: '50pcs', UOM: 'Pack' },
      },
      {
        sku: 'PL-LIDFLT-95',
        name: 'Lid Flat 95mm 100pcs',
        cost: 65.0,
        selling: 100.0,
        attrs: { Size: '95mm', Quantity: '100pcs', UOM: 'Pack' },
      },
    ],
  },
  Spoon: {
    category: 'PLASTIC PRODUCT',
    variants: [
      {
        sku: 'PL-SPOBLKFRP-100',
        name: 'Spoon Black-Teardrop 100pcs',
        cost: 400.0,
        selling: 450.0,
        attrs: {
          Color: 'Black',
          Style: 'Teardrop',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-ICESPO',
        name: 'Ice Cream Spoon',
        cost: 25.0,
        selling: 55.0,
        attrs: { Style: 'Ice Cream', UOM: 'Pack' },
      },
    ],
  },
  'Straw Boba': {
    category: 'PLASTIC PRODUCT',
    variants: [
      {
        sku: 'PR-STRBPLN-100',
        name: 'Straw Boba Paper-Plain 100pcs',
        cost: 135.0,
        selling: 200.0,
        attrs: {
          Material: 'Paper',
          Style: 'Plain',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-STRBOBP-100',
        name: 'Straw Boba Plastic-Plain 100pcs',
        cost: 45.0,
        selling: 80.0,
        attrs: {
          Material: 'Plastic',
          Style: 'Plain',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-SCCSTRP-100',
        name: 'Straw Boba Plastic-SCC 100pcs',
        cost: 50.0,
        selling: 99.0,
        attrs: {
          Material: 'Plastic',
          Style: 'SCC',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-UBSTRBOB-100',
        name: 'Straw Boba Plastic-UB 100pcs',
        cost: 50.0,
        selling: 99.0,
        attrs: {
          Material: 'Plastic',
          Style: 'UB',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
    ],
  },
  'Straw Thin': {
    category: 'PLASTIC PRODUCT',
    variants: [
      {
        sku: 'PR-STRTPLN-100',
        name: 'Straw Thin Paper-Plain 100pcs',
        cost: 100.0,
        selling: 185.0,
        attrs: {
          Material: 'Paper',
          Style: 'Plain',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-SCCSTR-200',
        name: 'Straw Thin Plastic-SCC 200pcs',
        cost: 56.0,
        selling: 198.0,
        attrs: {
          Material: 'Plastic',
          Style: 'SCC',
          Quantity: '200pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-STRTHNP-100',
        name: 'Straw Thin Plastic-Plain 100pcs',
        cost: 25.0,
        selling: 50.0,
        attrs: {
          Material: 'Plastic',
          Style: 'Plain',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-STRTHNUB-200',
        name: 'Straw Thin Plastic-UB 200pcs',
        cost: 56.0,
        selling: 198.0,
        attrs: {
          Material: 'Plastic',
          Style: 'UB',
          Quantity: '200pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-STRTHNUB-100',
        name: 'Straw Thin Plastic-UB 100pcs',
        cost: 21.0,
        selling: 55.0,
        attrs: {
          Material: 'Plastic',
          Style: 'UB',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
    ],
  },
  'Take-Out Plastic': {
    category: 'PLASTIC PRODUCT',
    variants: [
      {
        sku: 'PL-UBTODBL-100',
        name: 'Take-Out Plastic Double-UB 100pcs',
        cost: 85.0,
        selling: 120.0,
        attrs: { Size: 'Double', Style: 'UB', Quantity: '100pcs', UOM: 'Pack' },
      },
      {
        sku: 'PL-UBTOSNGL-100',
        name: 'Take-Out Plastic Single-UB 100pcs',
        cost: 56.0,
        selling: 95.0,
        attrs: { Size: 'Single', Style: 'UB', Quantity: '100pcs', UOM: 'Pack' },
      },
      {
        sku: 'PL-LDPETOSNGPLN',
        name: 'Take-out Plastic Single Plain LDPE 100pcs',
        cost: 80.0,
        selling: 115.0,
        attrs: {
          Size: 'Single',
          Style: 'Plain LDPE',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
      {
        sku: 'PL-LDPETOBIGSNGPLN',
        name: 'Take-out Plastic Big Size Plain LDPE 100pcs',
        cost: 322.0,
        selling: 464.0,
        attrs: {
          Size: 'Big Single',
          Style: 'Plain LDPE',
          Quantity: '100pcs',
          UOM: 'Pack',
        },
      },
    ],
  },
  'Beverage Lid': {
    category: 'PLASTIC PRODUCT',
    variants: [
      {
        sku: 'PL-DBLELDWHI90mm',
        name: 'Double Beverage Lid White UB 90mm 50pcs per pack',
        cost: 45.0,
        selling: 60.0,
        attrs: {
          Color: 'White',
          Size: '90mm',
          Style: 'UB',
          Quantity: '50pcs',
          UOM: 'Pack',
        },
      },
    ],
  },
  'RTE (Ready-to-Eat)': {
    category: 'RTE',
    variants: [
      {
        sku: 'RT-BUFFWING',
        name: 'RTE Buffalo Wing Rice Meal',
        cost: 80.0,
        selling: 84.0,
        attrs: { Dish: 'Buffalo Wing', UOM: 'Pc' },
      },
      {
        sku: 'RT-CHKTERYKI',
        name: 'RTE Chicken Fillet Teriyaki Rice Meal',
        cost: 80.0,
        selling: 84.0,
        attrs: { Dish: 'Chicken Fillet Teriyaki', UOM: 'Pc' },
      },
      {
        sku: 'RT-FISHTAUS',
        name: 'RTE Fish W/ Tausi Rice Meal',
        cost: 80.0,
        selling: 84.0,
        attrs: { Dish: 'Fish with Tausi', UOM: 'Pc' },
      },
      {
        sku: 'RT-GRLPRKLMPO',
        name: 'RTE Grilled Pork Liempo Rice Meal',
        cost: 80.0,
        selling: 84.0,
        attrs: { Dish: 'Grilled Pork Liempo', UOM: 'Pc' },
      },
      {
        sku: 'RT-PRKHUM',
        name: 'RTE Pork Humba Rice Meal',
        cost: 80.0,
        selling: 84.0,
        attrs: { Dish: 'Pork Humba', UOM: 'Pc' },
      },
      {
        sku: 'RT-PRKSSIG',
        name: 'RTE Pork Sisig Rice Meal',
        cost: 80.0,
        selling: 84.0,
        attrs: { Dish: 'Pork Sisig', UOM: 'Pc' },
      },
      {
        sku: 'RT-PRKSTEAK',
        name: 'RTE Pork Steak Rice Meal',
        cost: 80.0,
        selling: 84.0,
        attrs: { Dish: 'Pork Steak', UOM: 'Pc' },
      },
    ],
  },
  Gelato: {
    category: 'GELATO',
    variants: [
      {
        sku: 'GL-CFMOCHA-3L',
        name: 'Gelato Cafe Mocha 3L',
        cost: 275.0,
        selling: 330.0,
        attrs: { Flavor: 'Cafe Mocha', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-CHRCHOAL-3L',
        name: 'Gelato Charcoal 3L',
        cost: 275.0,
        selling: 330.0,
        attrs: { Flavor: 'Charcoal', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-COKCRM-3L',
        name: 'Gelato Cookies and Cream 3L',
        cost: 260.0,
        selling: 320.0,
        attrs: { Flavor: 'Cookies and Cream', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-DRKCHLATE-3L',
        name: 'Gelato Dark Chocolate 3L',
        cost: 275.0,
        selling: 330.0,
        attrs: { Flavor: 'Dark Chocolate', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-MANGO-3L',
        name: 'Gelato Mango 3L',
        cost: 260.0,
        selling: 320.0,
        attrs: { Flavor: 'Mango', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-MATCHA-3L',
        name: 'Gelato Matcha 3L',
        cost: 275.0,
        selling: 330.0,
        attrs: { Flavor: 'Matcha', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-MLTEA-3L',
        name: 'Gelato Milktea 3L',
        cost: 260.0,
        selling: 320.0,
        attrs: { Flavor: 'Milktea', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-REDVLVT-3L',
        name: 'Gelato Red Velvet 3L',
        cost: 260.0,
        selling: 320.0,
        attrs: { Flavor: 'Red Velvet', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-STRWBRY-3L',
        name: 'Gelato Strawberry 3L',
        cost: 260.0,
        selling: 320.0,
        attrs: { Flavor: 'Strawberry', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-TABLYA-3L',
        name: 'Gelato Tableya 3L',
        cost: 260.0,
        selling: 320.0,
        attrs: { Flavor: 'Tableya', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-TARO-3L',
        name: 'Gelato Ube Taro 3L',
        cost: 260.0,
        selling: 320.0,
        attrs: { Flavor: 'Ube Taro', Volume: '3L', UOM: 'Tub' },
      },
      {
        sku: 'GL-VANILLA-3L',
        name: 'Gelato Vanilla 3L',
        cost: 260.0,
        selling: 320.0,
        attrs: { Flavor: 'Vanilla', Volume: '3L', UOM: 'Tub' },
      },
    ],
  },
  Cake: {
    category: 'BREAD AND PASTRIES',
    variants: [
      {
        sku: 'CK-UBE',
        name: 'Cake-Ube Cardinal',
        cost: 520.0,
        selling: 720.0,
        attrs: { Flavor: 'Ube', UOM: 'Whole' },
      },
      {
        sku: 'CK-RDVLVT',
        name: 'Cake-Red Velvet Cardinal',
        cost: 600.0,
        selling: 720.0,
        attrs: { Flavor: 'Red Velvet', UOM: 'Whole' },
      },
      {
        sku: 'CK-YMA',
        name: 'Cake-Yema Cardinal',
        cost: 470.0,
        selling: 575.0,
        attrs: { Flavor: 'Yema', UOM: 'Whole' },
      },
      {
        sku: 'CK-MNGOCRM',
        name: 'Cake-Mango Cream Cardinal',
        cost: 650.0,
        selling: 720.0,
        attrs: { Flavor: 'Mango Cream', UOM: 'Whole' },
      },
      {
        sku: 'CK-COFECRML',
        name: 'Cake-Coffee Caramel Cardinal',
        cost: 550.0,
        selling: 720.0,
        attrs: { Flavor: 'Coffee Caramel', UOM: 'Whole' },
      },
      {
        sku: 'CK-STWBRYSHRT',
        name: 'Cake-Strawberry Short Cardinal',
        cost: 650.0,
        selling: 750.0,
        attrs: { Flavor: 'Strawberry Short', UOM: 'Whole' },
      },
      {
        sku: 'CK-BSTNCRMPIE',
        name: 'Cake-Boston Cream Pie Cardinal',
        cost: 780.0,
        selling: 850.0,
        attrs: { Flavor: 'Boston Cream Pie', UOM: 'Whole' },
      },
      {
        sku: 'CK-MOIST',
        name: 'Cake-Chocolate Moist Cardinal',
        cost: 500.0,
        selling: 720.0,
        attrs: { Flavor: 'Chocolate Moist', UOM: 'Whole' },
      },
      {
        sku: 'CK-CUSTRD',
        name: 'Cake-Custard Cardinal',
        cost: 400.0,
        selling: 520.0,
        attrs: { Flavor: 'Custard', UOM: 'Whole' },
      },
      {
        sku: 'CK-TRFLE',
        name: 'Cake-Truffle Cardinal',
        cost: 750.0,
        selling: 820.0,
        attrs: { Flavor: 'Truffle', UOM: 'Whole' },
      },
      {
        sku: 'CK-COKISANDCRM',
        name: 'Cake-Cookies and Cream Cardinal',
        cost: 580.0,
        selling: 720.0,
        attrs: { Flavor: 'Cookies and Cream', UOM: 'Whole' },
      },
      {
        sku: 'CK-BNACRM',
        name: 'Cake-Banana Cream Cardinal',
        cost: 550.0,
        selling: 720.0,
        attrs: { Flavor: 'Banana Cream', UOM: 'Whole' },
      },
      {
        sku: 'CK-CHCOHZLNTCRM',
        name: 'Cake-Chocohazelnut Crunch Cardinal',
        cost: 750.0,
        selling: 830.0,
        attrs: { Flavor: 'Chocohazelnut Crunch', UOM: 'Whole' },
      },
    ],
  },
  'Frozen Food': {
    category: 'FROZEN ITEM',
    variants: [
      {
        sku: 'FI-BACON',
        name: 'Bacon',
        cost: 508.25,
        selling: 584.49,
        attrs: { Type: 'Bacon', Weight: '1kg', UOM: 'Pc' },
      },
      {
        sku: 'FI-CHINUG',
        name: 'Chicken Nuggets',
        cost: 250.0,
        selling: 375.0,
        attrs: { Type: 'Chicken Nuggets', Quantity: '60pcs', UOM: 'Pack' },
      },
      {
        sku: 'FI-FRCHFRS',
        name: 'French Fries',
        cost: 110.0,
        selling: 199.0,
        attrs: { Type: 'French Fries', Weight: '1kg', UOM: 'Pc' },
      },
    ],
  },
  Syrup: {
    category: 'SYRUP',
    variants: [
      {
        sku: 'SY-BLKSUG-1L',
        name: 'Syrup Black Sugar 1L',
        cost: 253.0,
        selling: 350.0,
        attrs: { Flavor: 'Black Sugar', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SY-FRUCTSE-1L',
        name: 'Syrup Fructose 1L',
        cost: 88.0,
        selling: 125.0,
        attrs: { Flavor: 'Fructose', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SY-HAZNUT-750',
        name: 'Syrup Hazelnut 750mL',
        cost: 245.0,
        selling: 275.0,
        attrs: { Flavor: 'Hazelnut', Volume: '750mL', UOM: 'Pc' },
      },
      {
        sku: 'SY-STRBRRY',
        name: 'Syrup Strawberry',
        cost: 423.0,
        selling: 485.0,
        attrs: { Flavor: 'Strawberry', Volume: '750mL', UOM: 'Pc' },
      },
      {
        sku: 'SY-VANILL-1L',
        name: 'Syrup Vanilla',
        cost: 81.0,
        selling: 299.0,
        attrs: { Flavor: 'Vanilla', Volume: '1L', UOM: 'Pc' },
      },
    ],
  },
  Sauce: {
    category: 'SAUCE',
    variants: [
      {
        sku: 'SU-COLSDIP',
        name: 'Sauce Coleslaw Dip',
        cost: 181.6,
        selling: 285.0,
        attrs: { Flavor: 'Coleslaw Dip', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-AIOLI',
        name: 'Sauce Aioli',
        cost: 157.35,
        selling: 220.0,
        attrs: { Flavor: 'Aioli', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-GARPARM',
        name: 'Sauce Garlic Parmesan',
        cost: 173.44,
        selling: 225.0,
        attrs: { Flavor: 'Garlic Parmesan', Weight: '1kg', UOM: 'Pc' },
      },
      {
        sku: 'SU-MAYSPIC',
        name: 'Sauce Mayo Spicy',
        cost: 192.51,
        selling: 279.0,
        attrs: { Flavor: 'Mayo Spicy', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-MUSTRD-1K',
        name: 'Sauce Mustard 1kg',
        cost: 220.0,
        selling: 280.0,
        attrs: { Flavor: 'Mustard', Weight: '1kg', UOM: 'Pc' },
      },
      {
        sku: 'SU-PESTO',
        name: 'Sauce Pesto',
        cost: 680.07,
        selling: 800.0,
        attrs: { Flavor: 'Pesto', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-SPICHIC',
        name: 'Sauce Spicy Hickory',
        cost: 174.71,
        selling: 265.0,
        attrs: { Flavor: 'Spicy Hickory', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-TERYKI',
        name: 'Sauce Teriyaki',
        cost: 177.3,
        selling: 222.0,
        attrs: { Flavor: 'Teriyaki', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-TONKATS',
        name: 'Sauce Tonkatsu',
        cost: 243.92,
        selling: 280.0,
        attrs: { Flavor: 'Tonkatsu', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-REDSAU',
        name: 'Sauce Red',
        cost: 154.68,
        selling: 200.0,
        attrs: { Flavor: 'Red', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-WHISAU',
        name: 'Sauce White',
        cost: 144.05,
        selling: 185.0,
        attrs: { Flavor: 'White', Volume: '1L', UOM: 'Pc' },
      },
      {
        sku: 'SU-THISLDRS',
        name: 'Thousand Island Dressing',
        cost: 210.0,
        selling: 250.0,
        attrs: { Flavor: 'Thousand Island', Weight: '1kg', UOM: 'Pc' },
      },
    ],
  },
  Filling: {
    category: 'SAUCE',
    variants: [
      {
        sku: 'SU-PSTCIOFLNG1KG',
        name: 'Pistachio Filling 1Kg',
        cost: 1999.0,
        selling: 2150.0,
        attrs: { Flavor: 'Pistachio', Weight: '1kg', UOM: 'Pc' },
      },
    ],
  },
};

// Generate TypeScript file
let output = `export interface EkumpraVariantAttribute {
  name: string;
  value: string;
}

export interface EkumpraVariantData {
  variantName: string;
  variantDescription: string;
  variantSku: string;
  variantCostPrice: number;
  variantSellingPrice: number;
  variantStatus: string;
  variantMinimumOrder: number;
  attributes: EkumpraVariantAttribute[];
}

export interface EkumpraProductData {
  productName: string;
  productDescription: string;
  productStatus: string;
  categoryName: string;
  variants: EkumpraVariantData[];
}

export const EKUMPRA_PRODUCTS: EkumpraProductData[] = [\n`;

for (const [productName, data] of Object.entries(productsData)) {
  output += `  {\n`;
  output += `    productName: '${productName}',\n`;
  output += `    productDescription: 'E-KUMPRA ${productName} Products',\n`;
  output += `    productStatus: 'Published',\n`;
  output += `    categoryName: '${data.category}',\n`;
  output += `    variants: [\n`;

  for (const variant of data.variants) {
    output += `      {\n`;
    output += `        variantName: '${variant.name}',\n`;
    output += `        variantDescription: 'E-KUMPRA ${variant.name}',\n`;
    output += `        variantSku: '${variant.sku}',\n`;
    output += `        variantCostPrice: ${variant.cost},\n`;
    output += `        variantSellingPrice: ${variant.selling},\n`;
    output += `        variantStatus: 'Active',\n`;
    output += `        variantMinimumOrder: 1,\n`;
    output += `        attributes: [\n`;

    for (const [attrName, attrValue] of Object.entries(variant.attrs)) {
      output += `          { name: '${attrName}', value: '${attrValue}' },\n`;
    }

    output += `        ],\n`;
    output += `      },\n`;
  }

  output += `    ],\n`;
  output += `  },\n`;
}

output += `];\n`;

fs.writeFileSync(path.join(__dirname, 'ekumpra-products.data.ts'), output);
console.log(
  '✅ Generated ekumpra-products.data.ts with',
  Object.values(productsData).reduce((sum, p) => sum + p.variants.length, 0),
  'variants',
);
