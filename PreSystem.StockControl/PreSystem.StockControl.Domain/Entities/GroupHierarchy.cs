namespace PreSystem.StockControl.Domain.Entities
{
    // Grupo principal (nível 1 da hierarquia)
    public class ComponentGroup
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navegação
        public ICollection<ComponentDevice> Devices { get; set; } = new List<ComponentDevice>();
    }

    // Device (nível 2 da hierarquia)
    public class ComponentDevice
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int GroupId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navegação
        public ComponentGroup Group { get; set; } = null!;
        public ICollection<ComponentValue> Values { get; set; } = new List<ComponentValue>();
    }

    // Value (nível 3 da hierarquia)
    public class ComponentValue
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DeviceId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navegação
        public ComponentDevice Device { get; set; } = null!;
        public ICollection<ComponentPackage> Packages { get; set; } = new List<ComponentPackage>();
    }

    // Package (nível 4 da hierarquia)
    public class ComponentPackage
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ValueId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navegação
        public ComponentValue Value { get; set; } = null!;
    }
}