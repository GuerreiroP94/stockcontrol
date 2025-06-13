import * as XLSX from 'xlsx';
import { Component, Product } from '../types';

class ExportService {
  /**
   * Exporta componentes selecionados para Excel
   */
  exportComponentsToExcel(components: Component[], filename?: string) {
    const data = components.map(comp => ({
      'ID': comp.id,
      'Nome': comp.name,
      'Grupo': comp.group,
      'Device': comp.device || '',
      'Value': comp.value || '',
      'Package': comp.package || '',
      'Características': comp.characteristics || '',
      'Qtd. Estoque': comp.quantityInStock,
      'Qtd. Mínima': comp.minimumQuantity,
      'Preço Unit.': comp.price ? `R$ ${comp.price.toFixed(2)}` : '',
      'Ambiente': comp.environment || '',
      'Gaveta': comp.drawer || '',
      'Divisão': comp.division || '',
      'NCM': comp.ncm || '',
      'NVE': comp.nve || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 8 },   // ID
      { wch: 30 },  // Nome
      { wch: 15 },  // Grupo
      { wch: 20 },  // Device
      { wch: 10 },  // Value
      { wch: 12 },  // Package
      { wch: 25 },  // Características
      { wch: 12 },  // Qtd. Estoque
      { wch: 12 },  // Qtd. Mínima
      { wch: 12 },  // Preço Unit.
      { wch: 12 },  // Ambiente
      { wch: 10 },  // Gaveta
      { wch: 10 },  // Divisão
      { wch: 15 },  // NCM
      { wch: 15 }   // NVE
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Componentes');
    
    const exportFilename = filename || `componentes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, exportFilename);
  }

  /**
   * Exporta produto com ordem customizada
   */
  exportProductWithCustomOrder(
    product: Product,
    components: Component[],
    componentOrder: number[],
    productionQuantity: number = 1,
    includeValues: boolean = true
  ) {
    // Criar mapa de componentes para acesso rápido
    const componentMap = new Map(components.map(c => [c.id, c]));
    
    // Organizar componentes na ordem especificada
    const orderedComponents = componentOrder
      .map(id => {
        const productComp = product.components.find(pc => pc.componentId === id);
        const component = componentMap.get(id);
        return { productComp, component };
      })
      .filter(item => item.productComp && item.component);

    // Preparar dados para exportação
    const data: any[] = [];
    let totalValue = 0;

    orderedComponents.forEach((item, index) => {
      const { productComp, component } = item;
      const quantity = productComp!.quantity * productionQuantity;
      const unitPrice = component!.price || 0;
      const totalPrice = quantity * unitPrice;
      totalValue += totalPrice;

      const row: any = {
        'ORDEM': index + 1,
        'QTD': productComp!.quantity,
        'TOTAL': quantity,
        'DEVICE': component!.device || '',
        'VALUE': component!.value || '',
        'PACKAGE': component!.package || '',
        'CÓD.': `INTC${String(component!.id).padStart(4, '0')}`,
        'GAVETA': component!.drawer || '',
        'ESTOQUE': component!.quantityInStock,
        'COMPRAR': Math.max(0, quantity - component!.quantityInStock)
      };

      if (includeValues) {
        row['VALOR UNIT.'] = `R$ ${unitPrice.toFixed(2)}`;
        row['VALOR TOTAL'] = `R$ ${totalPrice.toFixed(2)}`;
      }

      data.push(row);
    });

    // Adicionar linha de total se incluir valores
    if (includeValues && data.length > 0) {
      data.push({});
      data.push({
        'ORDEM': '',
        'QTD': '',
        'TOTAL': 'TOTAL GERAL',
        'DEVICE': '',
        'VALUE': '',
        'PACKAGE': '',
        'CÓD.': '',
        'GAVETA': '',
        'ESTOQUE': '',
        'COMPRAR': '',
        'VALOR UNIT.': '',
        'VALOR TOTAL': `R$ ${totalValue.toFixed(2)}`
      });
    }

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Configurar largura das colunas
    const colWidths = [
      { wch: 8 },   // ORDEM
      { wch: 6 },   // QTD
      { wch: 8 },   // TOTAL
      { wch: 20 },  // DEVICE
      { wch: 10 },  // VALUE
      { wch: 12 },  // PACKAGE
      { wch: 10 },  // CÓD.
      { wch: 8 },   // GAVETA
      { wch: 10 },  // ESTOQUE
      { wch: 10 }   // COMPRAR
    ];
    
    if (includeValues) {
      colWidths.push({ wch: 12 }); // VALOR UNIT.
      colWidths.push({ wch: 12 }); // VALOR TOTAL
    }
    
    ws['!cols'] = colWidths;

    // Aplicar estilos (destacar coluna COMPRAR)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const comprarCol = includeValues ? 9 : 9; // Coluna J
    
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: comprarCol });
      if (ws[cellAddress]) {
        const value = parseInt(ws[cellAddress].v) || 0;
        if (value > 0) {
          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: "FFE6E6" } }, // Rosa claro para itens a comprar
            font: { color: { rgb: "FF0000" }, bold: true } // Texto vermelho
          };
        }
      }
    }

    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Adicionar informações do produto como cabeçalho
    const headerWs = XLSX.utils.aoa_to_sheet([
      [`RELATÓRIO DE PRODUÇÃO - ${product.name}`],
      [`Unidades a Fabricar: ${productionQuantity}`],
      [''],
    ]);
    
    // Mesclar células do título
    headerWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: includeValues ? 11 : 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: includeValues ? 11 : 9 } }
    ];

    // Adicionar dados ao header
    XLSX.utils.sheet_add_json(headerWs, data, { origin: 'A4' });
    
    XLSX.utils.book_append_sheet(wb, headerWs, 'Produção');
    
    const filename = `RELATORIO_DE_PRODUCAO_${product.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Exporta múltiplos produtos (exportação cruzada)
   */
  exportCrossProducts(
    selectedProducts: Product[],
    components: Component[],
    productQuantities: { [productId: number]: number },
    mergedComponents: any[],
    componentOrder: number[],
    includeValues: boolean = true
  ) {
    // Criar mapa de componentes
    const componentMap = new Map(components.map(c => [c.id, c]));
    
    // Preparar dados seguindo a ordem especificada
    const data: any[] = [];
    let totalValue = 0;

    componentOrder.forEach((componentId, index) => {
      const merged = mergedComponents.find(m => m.componentId === componentId);
      if (!merged) return;
      
      const component = componentMap.get(componentId);
      if (!component) return;

      const unitPrice = component.price || 0;
      const totalPrice = merged.totalQuantity * unitPrice;
      totalValue += totalPrice;

      // Listar produtos que usam este componente
      const productsList = merged.products
        .map((p: any) => `${productQuantities[p.productId]} ${p.productName}`)
        .join(', ');

      const row: any = {
        'Código Interno': `INTC${String(componentId).padStart(4, '0')}`,
        'Componente': component.name,
        'Device': component.device || '',
        'Value': component.value || '',
        'Package': component.package || '',
        'Características': component.characteristics || '',
        'Gaveta': component.drawer || '',
        'Divisão': component.division || '',
        'Qtd Total': merged.totalQuantity,
        'Produtos': productsList
      };

      if (includeValues) {
        row['Preço Unit.'] = `R$ ${unitPrice.toFixed(2)}`;
        row['Preço Total'] = `R$ ${totalPrice.toFixed(2)}`;
      }

      data.push(row);
    });

    // Adicionar total se incluir valores
    if (includeValues) {
      data.push({});
      data.push({
        'Código Interno': 'TOTAL GERAL',
        'Componente': '',
        'Device': '',
        'Value': '',
        'Package': '',
        'Características': '',
        'Gaveta': '',
        'Divisão': '',
        'Qtd Total': '',
        'Produtos': '',
        'Preço Unit.': '',
        'Preço Total': `R$ ${totalValue.toFixed(2)}`
      });
    }

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Configurar larguras
    const colWidths = [
      { wch: 15 },  // Código Interno
      { wch: 30 },  // Componente
      { wch: 20 },  // Device
      { wch: 10 },  // Value
      { wch: 12 },  // Package
      { wch: 25 },  // Características
      { wch: 10 },  // Gaveta
      { wch: 10 },  // Divisão
      { wch: 10 },  // Qtd Total
      { wch: 40 },  // Produtos
    ];
    
    if (includeValues) {
      colWidths.push({ wch: 12 }); // Preço Unit.
      colWidths.push({ wch: 12 }); // Preço Total
    }
    
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exportação Cruzada');
    
    const filename = `exportacao_cruzada_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Exporta componentes com filtros de colunas personalizados
   */
  exportComponentsWithColumnFilter(
    components: Component[],
    selectedColumns: Set<string>,
    filename?: string
  ) {
    // Mapeamento de colunas
    const columnMapping: { [key: string]: (comp: Component) => any } = {
      'id': (comp) => comp.id,
      'name': (comp) => comp.name,
      'description': (comp) => comp.description || '',
      'group': (comp) => comp.group,
      'device': (comp) => comp.device || '',
      'value': (comp) => comp.value || '',
      'package': (comp) => comp.package || '',
      'characteristics': (comp) => comp.characteristics || '',
      'quantityInStock': (comp) => comp.quantityInStock,
      'minimumQuantity': (comp) => comp.minimumQuantity,
      'price': (comp) => comp.price ? `R$ ${comp.price.toFixed(2)}` : '',
      'environment': (comp) => comp.environment || '',
      'drawer': (comp) => comp.drawer || '',
      'division': (comp) => comp.division || '',
      'ncm': (comp) => comp.ncm || '',
      'nve': (comp) => comp.nve || '',
      'internalCode': (comp) => comp.internalCode || '',
      'createdAt': (comp) => comp.createdAt ? new Date(comp.createdAt).toLocaleDateString('pt-BR') : ''
    };

    // Headers em português
    const headerMapping: { [key: string]: string } = {
      'id': 'ID',
      'name': 'Nome',
      'description': 'Descrição',
      'group': 'Grupo',
      'device': 'Device',
      'value': 'Value',
      'package': 'Package',
      'characteristics': 'Características',
      'quantityInStock': 'Qtd. Estoque',
      'minimumQuantity': 'Qtd. Mínima',
      'price': 'Preço',
      'environment': 'Ambiente',
      'drawer': 'Gaveta',
      'division': 'Divisão',
      'ncm': 'NCM',
      'nve': 'NVE',
      'internalCode': 'Código Interno',
      'createdAt': 'Data Criação'
    };

    // Criar dados apenas com colunas selecionadas
    const data = components.map(comp => {
      const row: any = {};
      selectedColumns.forEach(col => {
        if (columnMapping[col] && headerMapping[col]) {
          row[headerMapping[col]] = columnMapping[col](comp);
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Componentes');
    
    const exportFilename = filename || `componentes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, exportFilename);
  }

  /**
   * Exporta lista de compras de componentes em alerta
   */
  exportPurchaseList(components: any[], filename?: string) {
    const data = components.map(comp => ({
      'Qtd Utilizada': comp.totalUsage || 0,
      'Qtd. Total': comp.totalPurchaseQuantity || 0,
      'Device': comp.device || '',
      'Value': comp.value || '',
      'Package': comp.package || '',
      'Características': comp.characteristics || '',
      'Cód. Interno': comp.internalCode || '',
      'Gaveta': comp.drawer || '',
      'Divisão': comp.division || '',
      'Qtd. Estoque': comp.quantityInStock || 0,
      'Qtd. Comprar': comp.quantityToBuy || 0,
      'Preço Total': `R$ ${(comp.totalPurchasePrice || 0).toFixed(2)}`
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Destacar coluna de quantidade a comprar
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const qtdComprarCol = 10; // Coluna K
    
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: qtdComprarCol });
      if (ws[cellAddress] && parseInt(ws[cellAddress].v) > 0) {
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: "FFE6E6" } },
          font: { color: { rgb: "FF0000" }, bold: true }
        };
      }
    }

    // Configurar larguras
    ws['!cols'] = [
      { wch: 12 },  // Qtd Utilizada
      { wch: 10 },  // Qtd. Total
      { wch: 20 },  // Device
      { wch: 10 },  // Value
      { wch: 12 },  // Package
      { wch: 25 },  // Características
      { wch: 12 },  // Cód. Interno
      { wch: 10 },  // Gaveta
      { wch: 10 },  // Divisão
      { wch: 12 },  // Qtd. Estoque
      { wch: 12 },  // Qtd. Comprar
      { wch: 12 }   // Preço Total
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de Compras');
    
    const exportFilename = filename || `lista_compras_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, exportFilename);
  }
}

export default new ExportService();