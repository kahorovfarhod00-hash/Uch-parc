// Файл: Data/AppDbContext.cs
using System.Collections.Generic;
using System.Reflection.Emit;
using Microsoft.EntityFrameworkCore;
using uch_prac.Models;

namespace uch_prac.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Product> Products { get; set; }
        public DbSet<ProductType> ProductTypes { get; set; }
        public DbSet<Material> Materials { get; set; }
        public DbSet<MaterialType> MaterialTypes { get; set; }
        public DbSet<ProductMaterial> ProductMaterials { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Связь Product → ProductType
            modelBuilder.Entity<Product>()
                .HasOne(p => p.ProductType)
                .WithMany(pt => pt.Products)
                .HasForeignKey(p => p.TypeId);

            // Связь Material → MaterialType
            modelBuilder.Entity<Material>()
                .HasOne(m => m.MaterialType)
                .WithMany(mt => mt.Materials)
                .HasForeignKey(m => m.TypeId);

            // Связь ProductMaterial → Product
            modelBuilder.Entity<ProductMaterial>()
                .HasOne(pm => pm.Product)
                .WithMany(p => p.ProductMaterials)
                .HasForeignKey(pm => pm.ProductId);

            // Связь ProductMaterial → Material
            modelBuilder.Entity<ProductMaterial>()
                .HasOne(pm => pm.Material)
                .WithMany(m => m.ProductMaterials)
                .HasForeignKey(pm => pm.MaterialId);
        }
    }
}