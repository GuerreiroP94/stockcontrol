import * as XLSX from 'xlsx';
import { Component, Product, MergedComponent, AlertedComponent } from '../types';
import { formatCurrency } from '../utils/helpers';

interface SummaryData {
  [key: string]: string | number;
}

class ExportService {
  // Função auxiliar para calcular largura da coluna baseada no conteúdo
  private calculateColumnWidth(data: any[], columnKey: string, headerText: string): number {
    // Largura mínima baseada no header
    let maxLength = headerText.length;
    
    // Verificar o conteúdo de cada linha
    data.forEach(row => {
      if (row[headerText] !== null && row[headerText] !== undefined) {
        const cellValue = String(row[headerText]);
        maxLength = Math.max(maxLength, cellValue.length);
      }
    });
    
    // Larguras mínimas específicas para cada tipo de coluna
    const minWidths: { [key: string]: number } = {
      'ID': 5,
      'Grupo': 12,
      'Device': 15,
      'Value': 10,
      'Package': 10,
      'Cód. Interno': 12,
      'Descrição': 25,
      'Qtd. Estoque': 12,
      'Qtd. Mínima': 12,
      'Preço Unit.': 12,
      'Ambiente': 12,
      'Gaveta': 10,
      'Divisão': 10,
      'NCM': 12,
      'NVE': 8,
      'Características': 20
    };
    
    // Obter largura mínima para a coluna
    const minWidth = minWidths[headerText] || 10;
    
    // Calcular largura com fator de padding para Google Sheets
    // Fator 1.2 para dar um espaço extra
    const calculatedWidth = Math.max(maxLength * 1.2, minWidth);
    
    // Limitar entre min e max
    return Math.min(Math.ceil(calculatedWidth), 50);
  }

  // Função para gerar configuração de larguras automáticas
  private generateAutoColumnWidths(data: any[]): any[] {
    if (!data || data.length === 0) return [];
    
    const headers = Object.keys(data[0]);
    return headers.map(header => ({
      wch: this.calculateColumnWidth(data, header, header)
    }));
  }

  // Método principal para exportar componentes (esperado por useExport.ts)
  exportComponentsToExcel(components: Component[], filename: string = 'componentes.xlsx') {
    this.exportComponents(components, filename);
  }

  // Exportar componentes com filtro de colunas (esperado por useExport.ts)
  exportComponentsWithColumnFilter(
    components: Component[], 
    visibleColumns: Set<string> | { [key: string]: boolean },
    filename: string = 'componentes.xlsx'
  ) {
    const wb = XLSX.utils.book_new();
    
    // Converter Set para objeto se necessário
    const columns = visibleColumns instanceof Set 
      ? Object.fromEntries(Array.from(visibleColumns).map(col => [col, true]))
      : visibleColumns;
    
    const data = components.map(comp => {
      const row: any = {};
      
      if (columns.id !== false) row['ID'] = comp.id;
      if (columns.group !== false) row['Grupo'] = comp.group;
      if (columns.device !== false) row['Device'] = comp.device || '';
      if (columns.value !== false) row['Value'] = comp.value || '';
      if (columns.package !== false) row['Package'] = comp.package || '';
      if (columns.internalCode !== false) row['Cód. Interno'] = comp.internalCode || '';
      if (columns.description !== false) row['Descrição'] = comp.description || '';
      if (columns.quantityInStock !== false) row['Qtd. Estoque'] = comp.quantityInStock;
      if (columns.minimumQuantity !== false) row['Qtd. Mínima'] = comp.minimumQuantity;
      if (columns.price !== false) row['Preço Unit.'] = formatCurrency(comp.price || 0);
      if (columns.environment !== false) row['Ambiente'] = comp.environment === 'laboratorio' ? 'Laboratório' : 'Estoque';
      if (columns.drawer !== false) row['Gaveta'] = comp.drawer || '';
      if (columns.division !== false) row['Divisão'] = comp.division || '';
      if (columns.ncm !== false) row['NCM'] = comp.ncm || '';
      if (columns.nve !== false) row['NVE'] = comp.nve || '';
      if (columns.characteristics !== false) row['Características'] = comp.characteristics || '';
      
      return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Usar larguras automáticas baseadas no conteúdo
    ws['!cols'] = this.generateAutoColumnWidths(data);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Componentes');
    XLSX.writeFile(wb, filename);
  }

  // Exportar lista de componentes
  exportComponents(components: Component[], filename: string = 'componentes.xlsx') {
    const wb = XLSX.utils.book_new();
    
    const data = components.map(comp => ({
      'ID': comp.id,
      'Grupo': comp.group,
      'Device': comp.device || '',
      'Value': comp.value || '',
      'Package': comp.package || '',
      'Cód. Interno': comp.internalCode || '',
      'Descrição': comp.description || '',
      'Qtd. Estoque': comp.quantityInStock,
      'Qtd. Mínima': comp.minimumQuantity,
      'Preço Unit.': formatCurrency(comp.price || 0),
      'Ambiente': comp.environment === 'laboratorio' ? 'Laboratório' : 'Estoque',
      'Gaveta': comp.drawer || '',
      'Divisão': comp.division || '',
      'NCM': comp.ncm || '',
      'NVE': comp.nve || '',
      'Características': comp.characteristics || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Usar larguras automáticas baseadas no conteúdo
    ws['!cols'] = this.generateAutoColumnWidths(data);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Componentes');
    XLSX.writeFile(wb, filename);
  }

  // Exportar produto com ordem customizada
  exportProductWithCustomOrder(
    product: Product, 
    components: Component[], 
    customOrder: number[],
    productionQuantity: number = 1,
    includeValues: boolean = true
  ) {
    const wb = XLSX.utils.book_new();
    
    // Criar dados ordenados
    const orderedData = customOrder.map((componentId, index) => {
      const productComponent = product.components.find(pc => pc.componentId === componentId);
      const component = components.find(c => c.id === componentId);
      
      if (!productComponent || !component) return null;
      
      const quantity = productComponent.quantity * productionQuantity;
      const needToBuy = Math.max(0, quantity - component.quantityInStock);
      
      const row: any = {
        'ORDEM': index + 1,
        'QTD': productComponent.quantity,
        'TOTAL': quantity,
        'GRUPO': component.group || '',
        'DEVICE': component.device || '',
        'VALUE': component.value || '',
        'PACKAGE': component.package || '',
        'GAVETA': component.drawer || '',
        'ESTOQUE': component.quantityInStock,
        'COMPRAR': needToBuy > 0 ? needToBuy : 0
      };
      
      if (includeValues) {
        row['VALOR'] = `R$ ${((component.price || 0) * quantity).toFixed(2).replace('.', ',')}`;
      }
      
      return row;
    }).filter(Boolean);
    
    const ws = XLSX.utils.json_to_sheet(orderedData);
    
    // Usar larguras automáticas baseadas no conteúdo
    ws['!cols'] = this.generateAutoColumnWidths(orderedData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Componentes');
    
    // Adicionar aba de resumo
    const summaryData: SummaryData = {
      'Produto': product.name,
      'Quantidade a Produzir': productionQuantity,
      'Total de Componentes': customOrder.length,
      'Data': new Date().toLocaleDateString('pt-BR'),
      'Hora': new Date().toLocaleTimeString('pt-BR')
    };
    
    if (includeValues) {
      const totalValue = orderedData.reduce((sum, row) => {
        if (row && row.VALOR) {
          const value = parseFloat(row.VALOR.replace('R$', '').replace(',', '.'));
          return sum + value;
        }
        return sum;
      }, 0);
      summaryData['Valor Total'] = `R$ ${totalValue.toFixed(2).replace('.', ',')}`;
    }
    
    const wsSummary = XLSX.utils.json_to_sheet([summaryData]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    
    // Gerar arquivo
    const fileName = `produto_${product.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar múltiplos produtos (exportação cruzada)
  exportCrossProducts(
    selectedProducts: Product[], 
    components: Component[],
    includeValues: boolean = true
  ) {
    const wb = XLSX.utils.book_new();
    
    // Mesclar componentes de todos os produtos
    const mergedComponents = this.mergeProductComponents(selectedProducts, components);
    
    // Dados para planilha principal
    const mainData = mergedComponents.map((mergedComp, index) => {
      const component = components.find(c => c.id === mergedComp.componentId);
      if (!component) return null;
      
      const row: any = {
        'ORDEM': index + 1,
        'GRUPO': component.group || '',
        'DEVICE': component.device || '',
        'VALUE': component.value || '',
        'PACKAGE': component.package || '',
        'CÓDIGO': component.internalCode || '',
        'QTD TOTAL': mergedComp.totalQuantity,
        'PRODUTOS': mergedComp.products.join(', ')
      };
      
      if (includeValues && component.price) {
        row['VALOR UNIT.'] = formatCurrency(component.price);
        row['VALOR TOTAL'] = formatCurrency(component.price * mergedComp.totalQuantity);
      }
      
      return row;
    }).filter(Boolean);
    
    const wsMain = XLSX.utils.json_to_sheet(mainData);
    
    // Usar larguras automáticas
    wsMain['!cols'] = this.generateAutoColumnWidths(mainData);
    
    XLSX.utils.book_append_sheet(wb, wsMain, 'Componentes Consolidados');
    
    // Adicionar aba por produto
    selectedProducts.forEach(product => {
      const productData = product.components.map((pc, index) => {
        const component = components.find(c => c.id === pc.componentId);
        if (!component) return null;
        
        const row: any = {
          'ORDEM': index + 1,
          'GRUPO': component.group || '',
          'DEVICE': component.device || '',
          'VALUE': component.value || '',
          'PACKAGE': component.package || '',
          'QUANTIDADE': pc.quantity
        };
        
        if (includeValues && component.price) {
          row['VALOR UNIT.'] = formatCurrency(component.price);
          row['VALOR TOTAL'] = formatCurrency(component.price * pc.quantity);
        }
        
        return row;
      }).filter(Boolean);
      
      const wsProduct = XLSX.utils.json_to_sheet(productData);
      wsProduct['!cols'] = this.generateAutoColumnWidths(productData);
      
      const sheetName = product.name.substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, '');
      XLSX.utils.book_append_sheet(wb, wsProduct, sheetName);
    });
    
    // Gerar arquivo
    const fileName = `exportacao_cruzada_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar lista de compras
  exportPurchaseList(alertedComponents: AlertedComponent[]) {
    const wb = XLSX.utils.book_new();
    
    // Agrupar por componente (ignorando ambiente)
    const grouped = new Map<string, AlertedComponent[]>();
    
    alertedComponents.forEach(comp => {
      const key = `${comp.group}-${comp.device}-${comp.value}-${comp.package}-${comp.internalCode}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(comp);
    });
    
    // Criar dados agrupados
    const purchaseData = Array.from(grouped.entries()).map(([key, components], index) => {
      const firstComp = components[0];
      const environments = [...new Set(components.map(c => c.environment))];
      const maxMinQuantity = Math.max(...components.map(c => c.minimumQuantity));
      const suggestedPurchase = maxMinQuantity * 2;
      const unitPrice = firstComp.price || 0;
      
      return {
        'ORDEM': index + 1,
        'GRUPO': firstComp.group,
        'DEVICE': firstComp.device || '',
        'VALUE': firstComp.value || '',
        'PACKAGE': firstComp.package || '',
        'CÓD. INTERNO': firstComp.internalCode || '',
        'AMBIENTES': environments.map(e => e === 'laboratorio' ? 'Lab' : 'Est').join(', '),
        'QTD. MÍNIMA': maxMinQuantity,
        'SUGESTÃO COMPRA': suggestedPurchase,
        'PREÇO UNIT.': formatCurrency(unitPrice),
        'TOTAL': formatCurrency(suggestedPurchase * unitPrice)
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(purchaseData);
    
    // Usar larguras automáticas
    ws['!cols'] = this.generateAutoColumnWidths(purchaseData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Lista de Compras');
    
    // Adicionar resumo
    const summaryData: SummaryData = {
      'Total de Itens': purchaseData.length,
      'Valor Total': formatCurrency(purchaseData.reduce((sum, item) => {
        const value = parseFloat(item.TOTAL.replace('R$', '').replace('.', '').replace(',', '.'));
        return sum + value;
      }, 0)),
      'Data': new Date().toLocaleDateString('pt-BR'),
      'Hora': new Date().toLocaleTimeString('pt-BR')
    };
    
    const wsSummary = XLSX.utils.json_to_sheet([summaryData]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    
    // Gerar arquivo
    const fileName = `lista_compras_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Método auxiliar para mesclar componentes
  private mergeProductComponents(products: Product[], components: Component[]): MergedComponent[] {
    const componentMap = new Map<number, MergedComponent>();
    
    products.forEach(product => {
      product.components.forEach(pc => {
        if (componentMap.has(pc.componentId)) {
          const existing = componentMap.get(pc.componentId)!;
          existing.totalQuantity += pc.quantity;
          existing.products.push(product.name);
        } else {
          const component = components.find(c => c.id === pc.componentId);
          componentMap.set(pc.componentId, {
            componentId: pc.componentId,
            componentName: component?.name || pc.componentName,
            group: component?.group || pc.group,
            device: component?.device,
            value: component?.value,
            package: component?.package,
            characteristics: component?.characteristics,
            internalCode: component?.internalCode,
            drawer: component?.drawer,
            division: component?.division,
            totalQuantity: pc.quantity,
            products: [product.name],
            unitPrice: component?.price
          });
        }
      });
    });
    
    return Array.from(componentMap.values());
  }
}

const exportService = new ExportService();
export default exportService;