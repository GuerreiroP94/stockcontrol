import * as XLSX from 'xlsx';
import { Component, Product } from '../types';

// Função auxiliar para calcular largura ideal da coluna baseado no conteúdo
function calculateColumnWidth(data: any[], key: string, minWidth: number = 10): number {
  const maxLength = Math.max(
    key.length, // Tamanho do header
    ...data.map(row => String(row[key] || '').length)
  );
  return Math.min(Math.max(maxLength + 2, minWidth), 50); // +2 para padding, máximo 50
}

// Função auxiliar para aplicar estilo de destaque
function applyHighlightStyle(ws: XLSX.WorkSheet, colIndex: number, condition: (value: any) => boolean) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  for (let row = 1; row <= range.e.r; row++) { // Começar da linha 1 (pular header)
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex });
    const cell = ws[cellAddress];
    
    if (cell && condition(cell.v)) {
      if (!cell.s) cell.s = {};
      cell.s.fill = { fgColor: { rgb: "FFE6E6" } };
      cell.s.font = { color: { rgb: "FF0000" }, bold: true };
    }
  }
}

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
    
    // Ajustar largura das colunas baseado no conteúdo
    const columns = Object.keys(data[0] || {});
    ws['!cols'] = columns.map(col => ({
      wch: calculateColumnWidth(data, col)
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Componentes');
    
    const exportFilename = filename || `componentes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, exportFilename);
  }

  /**
   * Exporta produto com ordem customizada - CORRIGIDO
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

    // Preparar dados para exportação - REMOVIDAS colunas ORDEM e TOTAL
    const data: any[] = [];
    let totalValue = 0;

    orderedComponents.forEach((item) => {
      const { productComp, component } = item;
      const quantity = productComp!.quantity * productionQuantity;
      const unitPrice = component!.price || 0;
      const totalPrice = quantity * unitPrice;
      totalValue += totalPrice;

      const row: any = {
        'QTD': productComp!.quantity,
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
        'QTD': '',
        'DEVICE': 'TOTAL GERAL',
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
    
    // Configurar largura das colunas baseado no conteúdo
    const columns = Object.keys(data[0] || {});
    ws['!cols'] = columns.map(col => ({
      wch: calculateColumnWidth(data, col)
    }));

    // Aplicar estilo de destaque na coluna COMPRAR
    const comprarColIndex = columns.indexOf('COMPRAR');
    if (comprarColIndex !== -1) {
      applyHighlightStyle(ws, comprarColIndex, (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num > 0;
      });
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
      { s: { r: 0, c: 0 }, e: { r: 0, c: includeValues ? 9 : 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: includeValues ? 9 : 7 } }
    ];

    // Adicionar dados ao header
    XLSX.utils.sheet_add_json(headerWs, data, { origin: 'A4' });
    
    // Copiar larguras de coluna
    headerWs['!cols'] = ws['!cols'];
    
    // Aplicar estilo na coluna COMPRAR no header worksheet também
    if (comprarColIndex !== -1) {
      applyHighlightStyle(headerWs, comprarColIndex, (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num > 0;
      });
    }
    
    XLSX.utils.book_append_sheet(wb, headerWs, 'Produção');
    
    const filename = `RELATORIO_DE_PRODUCAO_${product.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Exporta múltiplos produtos (exportação cruzada) - CORRIGIDO
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
    
    // Preparar dados seguindo a ordem especificada - REMOVIDA coluna Código Interno
    const data: any[] = [];
    let totalValue = 0;

    componentOrder.forEach((componentId) => {
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
        'Qtd Utilizada': merged.totalUsage || merged.totalQuantity,
        'Qtd. Total': merged.totalQuantity,
        'Device': component.device || '',
        'Value': component.value || '',
        'Package': component.package || '',
        'Características': component.characteristics || '',
        'Gaveta': component.drawer || '',
        'Divisão': component.division || '',
        'Qtd. Estoque': component.quantityInStock,
        'Qtd. Comprar': Math.max(0, merged.totalQuantity - component.quantityInStock),
        'Produtos': productsList
      };

      if (includeValues) {
        row['Preço Total'] = `R$ ${totalPrice.toFixed(2)}`;
      }

      data.push(row);
    });

    // Adicionar total se incluir valores
    if (includeValues && data.length > 0) {
      data.push({});
      data.push({
        'Qtd Utilizada': '',
        'Qtd. Total': 'TOTAL GERAL',
        'Device': '',
        'Value': '',
        'Package': '',
        'Características': '',
        'Gaveta': '',
        'Divisão': '',
        'Qtd. Estoque': '',
        'Qtd. Comprar': '',
        'Produtos': '',
        'Preço Total': `R$ ${totalValue.toFixed(2)}`
      });
    }

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Configurar larguras baseado no conteúdo
    const columns = Object.keys(data[0] || {});
    ws['!cols'] = columns.map(col => ({
      wch: calculateColumnWidth(data, col)
    }));

    // Aplicar estilo de destaque na coluna Qtd. Comprar
    const qtdComprarColIndex = columns.indexOf('Qtd. Comprar');
    if (qtdComprarColIndex !== -1) {
      applyHighlightStyle(ws, qtdComprarColIndex, (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num > 0;
      });
    }

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
    
    // Ajustar largura das colunas baseado no conteúdo
    const columns = Object.keys(data[0] || {});
    ws['!cols'] = columns.map(col => ({
      wch: calculateColumnWidth(data, col)
    }));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Componentes');
    
    const exportFilename = filename || `componentes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, exportFilename);
  }

  /**
   * Exporta lista de compras de componentes em alerta - CORRIGIDO
   */
  exportPurchaseList(components: any[], filename?: string) {
    const data = components.map(comp => ({
      'Grupo': comp.group || '',
      'Device': comp.device || '',
      'Value': comp.value || '',
      'Package': comp.package || '',
      'Características': comp.characteristics || '',
      'Cód. Interno': comp.internalCode || `INTC${String(comp.id).padStart(4, '0')}`,
      'Gaveta': comp.drawer || '',
      'Divisão': comp.division || '',
      'Qtd. Estoque': comp.quantityInStock || 0,
      'Qtd. Comprar': comp.minimumQuantity ? comp.minimumQuantity * 2 : (comp.suggestedPurchase || 0),
      'Preço Total': `R$ ${((comp.minimumQuantity ? comp.minimumQuantity * 2 : (comp.suggestedPurchase || 0)) * (comp.price || 0)).toFixed(2)}`
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Destacar coluna de quantidade a comprar
    const columns = Object.keys(data[0] || {});
    const qtdComprarColIndex = columns.indexOf('Qtd. Comprar');
    
    if (qtdComprarColIndex !== -1) {
      applyHighlightStyle(ws, qtdComprarColIndex, (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num > 0;
      });
    }

    // Configurar larguras baseado no conteúdo
    ws['!cols'] = columns.map(col => ({
      wch: calculateColumnWidth(data, col)
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de Compras');
    
    const exportFilename = filename || `lista_compras_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, exportFilename);
  }
}

export default new ExportService();