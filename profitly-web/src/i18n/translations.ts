export type Lang = 'pt' | 'en' | 'es'

export const translations = {
  pt: {
    nav: { tickers: 'Tickers', wallet: 'Carteira' },
    header: { logout: 'Sair', search: 'Buscar ticker...' },
    settings: { language: 'Idioma', theme: 'Tema' },

    wallet: {
      invested: 'Investido',
      currentValue: 'Valor atual',
      profitLoss: 'Lucro / Prejuízo',
      return: 'Retorno',
      allocation: 'Alocação',
      addPosition: '+ Adicionar posição',
      newWallet: '+ Nova carteira',
      deleteWallet: 'Excluir carteira',
      editName: 'Renomear carteira',
      noWallets: 'Nenhuma carteira ainda.',
      createFirst: '+ Criar minha primeira carteira',
      loading: 'Carregando carteiras...',
      positions: 'Posições',
      assets: (n: number) => `${n} ativo${n !== 1 ? 's' : ''}`,
    },

    chart: {
      byTicker: 'Por ativo',
      byClass: 'Por classe',
    },

    assetType: {
      stock: 'Ações',
      unit: 'Units',
      fii: 'FIIs',
      etf: 'ETFs',
      bdr: 'BDRs',
      'fi-infra': 'FI-Infra',
      'fi-agro': 'FI-Agro',
      fip: 'FIPs',
      fidc: 'FIDCs',
      outros: 'Outros',
    },

    position: {
      ticker: 'Ticker',
      qty: 'Qtd',
      avgPrice: 'Preço médio',
      currentPrice: 'Preço atual',
      invested: 'Investido',
      currentValue: 'Valor atual',
      pnl: 'L/P',
      pnlPct: 'L/P %',
    },

    modal: {
      addPosition: 'Adicionar posição',
      ticker: 'Ticker',
      date: 'Data',
      quantity: 'Quantidade',
      paidPrice: 'Preço pago (R$)',
      totalInvested: 'Total investido',
      adding: 'Adicionando...',
      addEntry: '+ Adicionar entrada',
      cancel: 'Cancelar',
      selectTicker: 'Selecione um ticker...',
    },

    confirm: {
      deleteWallet: 'Excluir carteira',
      deleteWalletText: (name: string) =>
        `Tem certeza que deseja excluir a carteira "${name}"? Todas as posições serão perdidas.`,
      delete: 'Excluir',
      cancel: 'Cancelar',
    },

    dashboard: {
      tickersTracked: 'Tickers monitorados',
      allAssetTypes: 'todos os tipos',
      advancing: 'Avançando',
      inTheGreen: '↑ no verde',
      declining: 'Caindo',
      inTheRed: '↓ no vermelho',
      currency: 'Moeda',
      market: 'mercado B3',
      loading: 'Carregando tickers...',
      marketPulse: 'Pulso do Mercado',
      topGainers: 'Maiores Altas',
      topLosers: 'Maiores Baixas',
      distribution: 'Distribuição de Variações',
      distributionSub: 'Quantidade de ativos por faixa de variação (%)',
      neutral: 'Neutros',
      noChange: 'sem variação',
      breadthLabel: 'Mercado B3',
      tickerCount: 'ativos monitorados',
    },

    filter: { all: 'Todos', advancing: 'Avançando', declining: 'Caindo' },
  },

  en: {
    nav: { tickers: 'Tickers', wallet: 'Wallet' },
    header: { logout: 'Logout', search: 'Search ticker...' },
    settings: { language: 'Language', theme: 'Theme' },

    wallet: {
      invested: 'Invested',
      currentValue: 'Current value',
      profitLoss: 'Profit / Loss',
      return: 'Return',
      allocation: 'Allocation',
      addPosition: '+ Add position',
      newWallet: '+ New wallet',
      deleteWallet: 'Delete wallet',
      editName: 'Rename wallet',
      noWallets: 'No wallets yet.',
      createFirst: '+ Create your first wallet',
      loading: 'Loading wallets...',
      positions: 'Positions',
      assets: (n: number) => `${n} asset${n !== 1 ? 's' : ''}`,
    },

    chart: {
      byTicker: 'By ticker',
      byClass: 'By class',
    },

    assetType: {
      stock: 'Stocks',
      unit: 'Units',
      fii: 'FIIs',
      etf: 'ETFs',
      bdr: 'BDRs',
      'fi-infra': 'FI-Infra',
      'fi-agro': 'FI-Agro',
      fip: 'FIPs',
      fidc: 'FIDCs',
      outros: 'Other',
    },

    position: {
      ticker: 'Ticker',
      qty: 'Qty',
      avgPrice: 'Avg price',
      currentPrice: 'Current price',
      invested: 'Invested',
      currentValue: 'Current value',
      pnl: 'P&L',
      pnlPct: 'P&L %',
    },

    modal: {
      addPosition: 'Add position',
      ticker: 'Ticker',
      date: 'Date',
      quantity: 'Quantity',
      paidPrice: 'Paid price (R$)',
      totalInvested: 'Total invested',
      adding: 'Adding...',
      addEntry: '+ Add entry',
      cancel: 'Cancel',
      selectTicker: 'Select a ticker...',
    },

    confirm: {
      deleteWallet: 'Delete wallet',
      deleteWalletText: (name: string) =>
        `Are you sure you want to delete "${name}"? All positions and entries will be lost.`,
      delete: 'Delete',
      cancel: 'Cancel',
    },

    dashboard: {
      tickersTracked: 'Tickers tracked',
      allAssetTypes: 'all asset types',
      advancing: 'Advancing',
      inTheGreen: '↑ in the green',
      declining: 'Declining',
      inTheRed: '↓ in the red',
      currency: 'Currency',
      market: 'B3 market',
      loading: 'Loading tickers...',
      marketPulse: 'Market Pulse',
      topGainers: 'Top Gainers',
      topLosers: 'Top Losers',
      distribution: 'Change Distribution',
      distributionSub: 'Number of assets per change range (%)',
      neutral: 'Neutral',
      noChange: 'no change',
      breadthLabel: 'B3 Market',
      tickerCount: 'tracked assets',
    },

    filter: { all: 'All', advancing: 'Advancing', declining: 'Declining' },
  },

  es: {
    nav: { tickers: 'Tickers', wallet: 'Cartera' },
    header: { logout: 'Salir', search: 'Buscar ticker...' },
    settings: { language: 'Idioma', theme: 'Tema' },

    wallet: {
      invested: 'Invertido',
      currentValue: 'Valor actual',
      profitLoss: 'Ganancia / Pérdida',
      return: 'Retorno',
      allocation: 'Asignación',
      addPosition: '+ Agregar posición',
      newWallet: '+ Nueva cartera',
      deleteWallet: 'Eliminar cartera',
      editName: 'Renombrar cartera',
      noWallets: 'Sin carteras aún.',
      createFirst: '+ Crear mi primera cartera',
      loading: 'Cargando carteras...',
      positions: 'Posiciones',
      assets: (n: number) => `${n} activo${n !== 1 ? 's' : ''}`,
    },

    chart: {
      byTicker: 'Por activo',
      byClass: 'Por clase',
    },

    assetType: {
      stock: 'Acciones',
      unit: 'Units',
      fii: 'FIIs',
      etf: 'ETFs',
      bdr: 'BDRs',
      'fi-infra': 'FI-Infra',
      'fi-agro': 'FI-Agro',
      fip: 'FIPs',
      fidc: 'FIDCs',
      outros: 'Otros',
    },

    position: {
      ticker: 'Ticker',
      qty: 'Cant.',
      avgPrice: 'Precio promedio',
      currentPrice: 'Precio actual',
      invested: 'Invertido',
      currentValue: 'Valor actual',
      pnl: 'G/P',
      pnlPct: 'G/P %',
    },

    modal: {
      addPosition: 'Agregar posición',
      ticker: 'Ticker',
      date: 'Fecha',
      quantity: 'Cantidad',
      paidPrice: 'Precio pagado (R$)',
      totalInvested: 'Total invertido',
      adding: 'Agregando...',
      addEntry: '+ Agregar entrada',
      cancel: 'Cancelar',
      selectTicker: 'Seleccione un ticker...',
    },

    confirm: {
      deleteWallet: 'Eliminar cartera',
      deleteWalletText: (name: string) =>
        `¿Seguro que desea eliminar la cartera "${name}"? Se perderán todas las posiciones.`,
      delete: 'Eliminar',
      cancel: 'Cancelar',
    },

    dashboard: {
      tickersTracked: 'Tickers monitoreados',
      allAssetTypes: 'todos los tipos',
      advancing: 'Avanzando',
      inTheGreen: '↑ en verde',
      declining: 'Cayendo',
      inTheRed: '↓ en rojo',
      currency: 'Moneda',
      market: 'mercado B3',
      loading: 'Cargando tickers...',
      marketPulse: 'Pulso del Mercado',
      topGainers: 'Mayores Alzas',
      topLosers: 'Mayores Bajas',
      distribution: 'Distribución de Variaciones',
      distributionSub: 'Cantidad de activos por rango de variación (%)',
      neutral: 'Neutrales',
      noChange: 'sin cambio',
      breadthLabel: 'Mercado B3',
      tickerCount: 'activos monitoreados',
    },

    filter: { all: 'Todos', advancing: 'Avanzando', declining: 'Cayendo' },
  },
} satisfies Record<Lang, unknown>

export type Translations = typeof translations['en']
