namespace PreSystem.StockControl.Application.DTOs
{
    // DTOs para o sistema de hierarquia de grupos

    // DTO base para items da hierarquia
    public class HierarchyItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // DTO para Group com seus Devices
    public class ComponentGroupDto : HierarchyItemDto
    {
        public List<ComponentDeviceDto> Devices { get; set; } = new();
    }

    // DTO para Device com seus Values
    public class ComponentDeviceDto : HierarchyItemDto
    {
        public int GroupId { get; set; }
        public string? GroupName { get; set; }
        public List<ComponentValueDto> Values { get; set; } = new();
    }

    // DTO para Value com seus Packages
    public class ComponentValueDto : HierarchyItemDto
    {
        public int DeviceId { get; set; }
        public string? DeviceName { get; set; }
        public int GroupId { get; set; }
        public string? GroupName { get; set; }
        public List<ComponentPackageDto> Packages { get; set; } = new();
    }

    // DTO para Package
    public class ComponentPackageDto : HierarchyItemDto
    {
        public int ValueId { get; set; }
        public string? ValueName { get; set; }
        public int DeviceId { get; set; }
        public string? DeviceName { get; set; }
        public int GroupId { get; set; }
        public string? GroupName { get; set; }
    }

    // DTOs para criação/atualização
    public class HierarchyItemCreateDto
    {
        public string Name { get; set; } = string.Empty;
    }

    // DTO de resposta para criação/atualização
    public class HierarchyOperationResult
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public HierarchyItemDto? Item { get; set; }
    }

    // DTO para resposta completa da hierarquia
    public class GroupHierarchyResponseDto
    {
        public List<ComponentGroupDto> Groups { get; set; } = new();
        public List<ComponentDeviceDto> Devices { get; set; } = new();
        public List<ComponentValueDto> Values { get; set; } = new();
        public List<ComponentPackageDto> Packages { get; set; } = new();
    }
}