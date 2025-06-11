using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PreSystem.StockControl.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ComponentGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ComponentDevices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GroupId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComponentDevices_ComponentGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "ComponentGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ComponentValues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeviceId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComponentValues_ComponentDevices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "ComponentDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ComponentPackages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ValueId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentPackages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComponentPackages_ComponentValues_ValueId",
                        column: x => x.ValueId,
                        principalTable: "ComponentValues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComponentDevices_GroupId",
                table: "ComponentDevices",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ComponentPackages_ValueId",
                table: "ComponentPackages",
                column: "ValueId");

            migrationBuilder.CreateIndex(
                name: "IX_ComponentValues_DeviceId",
                table: "ComponentValues",
                column: "DeviceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComponentPackages");

            migrationBuilder.DropTable(
                name: "ComponentValues");

            migrationBuilder.DropTable(
                name: "ComponentDevices");

            migrationBuilder.DropTable(
                name: "ComponentGroups");
        }
    }
}
