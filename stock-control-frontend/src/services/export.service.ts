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
    
    const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, filename || `componentes_${date}.xlsx`);
  }

  // Exportar produto com ordem customizada - COLUNAS ATUALIZADAS
  exportProductWithCustomOrder(
    product: Product, 
    components: Component[], 
    customOrder: number[],
    productionQuantity: number = 1,
    includeValues: boolean = true
  ) {
    const wb = XLSX.utils.book_new();
    
    // Criar dados ordenados com NOVAS COLUNAS
    const orderedData = customOrder.map((componentId, index) => {
      const productComponent = product.components.find(pc => pc.componentId === componentId);
      const component = components.find(c => c.id === componentId);
      
      if (!productComponent || !component) return null;
      
      const totalQuantity = productComponent.quantity * productionQuantity;
      const needToBuy = Math.max(0, totalQuantity - component.quantityInStock);
      
      const row: any = {
        'ORDEM': index + 1,
        'QTD UTILIZADA': totalQuantity,
        'GRUPO': component.group || '',
        'DEVICE': component.device || '',
        'VALUE': component.value || '',
        'PACKAGE': component.package || '',
        'CARACTERÍSTICAS': component.characteristics || '',
        'GAVETA': component.drawer || '',
        'DIVISÃO': component.division || '',
        'QTD. ESTOQUE': component.quantityInStock,
        'QTD. COMPRAR': needToBuy > 0 ? needToBuy : 0
      };
      
      if (includeValues) {
        row['PREÇO TOTAL'] = formatCurrency((component.price || 0) * totalQuantity);
      }
      
      return row;
    }).filter(Boolean);
    
    const ws = XLSX.utils.json_to_sheet(orderedData);
    ws['!cols'] = this.generateAutoColumnWidths(orderedData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Componentes');
    
    // Adicionar aba de resumo
    const summaryData: SummaryData = {
      'Produto': product.name,
      'Quantidade a Produzir': productionQuantity,
      'Total de Componentes Únicos': customOrder.length,
      'Total de Unidades': orderedData.reduce((sum, row) => sum + (row['QTD UTILIZADA'] || 0), 0),
      'Data': new Date().toLocaleDateString('pt-BR'),
      'Hora': new Date().toLocaleTimeString('pt-BR')
    };
    
    if (includeValues) {
      const totalValue = orderedData.reduce((sum, row) => {
        if (row && row['PREÇO TOTAL']) {
          const value = parseFloat(row['PREÇO TOTAL'].replace('R$', '').replace(',', '.'));
          return sum + value;
        }
        return sum;
      }, 0);
      summaryData['Valor Total'] = formatCurrency(totalValue);
    }
    
    const wsSummary = XLSX.utils.json_to_sheet([summaryData]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    
    // Gerar arquivo
    const fileName = `produto_${product.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Mesclar componentes de múltiplos produtos
  private mergeProductComponents(selectedProducts: Product[], components: Component[]): MergedComponent[] {
    const componentMap = new Map<number, MergedComponent>();
    
    selectedProducts.forEach(product => {
      product.components.forEach(pc => {
        const component = components.find(c => c.id === pc.componentId);
        if (!component) return;
        
        if (componentMap.has(pc.componentId)) {
          const existing = componentMap.get(pc.componentId)!;
          existing.totalQuantity += pc.quantity;
          existing.products.push(product.name);
        } else {
          componentMap.set(pc.componentId, {
            componentId: pc.componentId,
            componentName: component.name || '',
            group: component.group || '',
            device: component.device,
            value: component.value,
            package: component.package,
            characteristics: component.characteristics,
            drawer: component.drawer,
            division: component.division,
            internalCode: component.internalCode,
            totalQuantity: pc.quantity,
            products: [product.name],
            unitPrice: component.price
          });
        }
      });
    });
    
    return Array.from(componentMap.values());
  }

  // Exportar múltiplos produtos (exportação cruzada) - COLUNAS ATUALIZADAS
  exportCrossProducts(
    selectedProducts: Product[], 
    components: Component[],
    includeValues: boolean = true
  ) {
    const wb = XLSX.utils.book_new();
    
    // Mesclar componentes de todos os produtos
    const mergedComponents = this.mergeProductComponents(selectedProducts, components);
    
    // Dados para planilha principal com NOVAS COLUNAS
    const mainData = mergedComponents.map((mergedComp, index) => {
      const component = components.find(c => c.id === mergedComp.componentId);
      if (!component) return null;
      
      const needToBuy = Math.max(0, mergedComp.totalQuantity - component.quantityInStock);
      
      const row: any = {
        'ORDEM': index + 1,
        'QTD': mergedComp.totalQuantity,
        'GRUPO': mergedComp.group || '',
        'DEVICE': mergedComp.device || '',
        'VALUE': mergedComp.value || '',
        'PACKAGE': mergedComp.package || '',
        'GAVETA': mergedComp.drawer || '',
        'DIVISÃO': mergedComp.division || '',
        'QTD ESTOQUE': component.quantityInStock,
        'QTD COMPRAR': needToBuy,
        'UNIDADE': mergedComp.products.join(', ')
      };
      
      if (includeValues && component.price) {
        row['PREÇO TOTAL'] = formatCurrency(component.price * mergedComp.totalQuantity);
      }
      
      return row;
    }).filter(Boolean);
    
    const wsMain = XLSX.utils.json_to_sheet(mainData);
    wsMain['!cols'] = this.generateAutoColumnWidths(mainData);
    
    XLSX.utils.book_append_sheet(wb, wsMain, 'Componentes Consolidados');
    
    // Adicionar aba por produto
    selectedProducts.forEach(product => {
      const productData = product.components.map((pc, index) => {
        const component = components.find(c => c.id === pc.componentId);
        if (!component) return null;
        
        const needToBuy = Math.max(0, pc.quantity - component.quantityInStock);
        
        const row: any = {
          'ORDEM': index + 1,
          'QTD UTILIZADA': pc.quantity,
          'GRUPO': component.group || '',
          'DEVICE': component.device || '',
          'VALUE': component.value || '',
          'PACKAGE': component.package || '',
          'CARACTERÍSTICAS': component.characteristics || '',
          'GAVETA': component.drawer || '',
          'DIVISÃO': component.division || '',
          'QTD. ESTOQUE': component.quantityInStock,
          'QTD. COMPRAR': needToBuy
        };
        
        if (includeValues && component.price) {
          row['PREÇO TOTAL'] = formatCurrency(component.price * pc.quantity);
        }
        
        return row;
      }).filter(Boolean);
      
      const wsProduct = XLSX.utils.json_to_sheet(productData);
      wsProduct['!cols'] = this.generateAutoColumnWidths(productData);
      
      // Nome da aba limitado a 31 caracteres (limite do Excel)
      const sheetName = product.name.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, wsProduct, sheetName);
    });
    
    // Adicionar resumo geral
    const summaryData: SummaryData = {
      'Total de Produtos': selectedProducts.length,
      'Total de Componentes Únicos': mergedComponents.length,
      'Total de Unidades': mergedComponents.reduce((sum, mc) => sum + mc.totalQuantity, 0),
      'Data': new Date().toLocaleDateString('pt-BR'),
      'Hora': new Date().toLocaleTimeString('pt-BR')
    };
    
    if (includeValues) {
      const totalValue = mergedComponents.reduce((sum, mc) => {
        const component = components.find(c => c.id === mc.componentId);
        return sum + ((component?.price || 0) * mc.totalQuantity);
      }, 0);
      summaryData['Valor Total'] = formatCurrency(totalValue);
    }
    
    const wsSummary = XLSX.utils.json_to_sheet([summaryData]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    
    // Gerar arquivo
    const fileName = `exportacao_cruzada_${selectedProducts.length}_produtos_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // Exportar lista de compras (MANTIDO EXATAMENTE COMO ESTAVA)
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
}

const exportService = new ExportService();
export default exportService;