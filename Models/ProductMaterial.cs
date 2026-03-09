using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace uch_prac.Models
{
    [Table("product_material")]
    public class ProductMaterial
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("product_id")]
        public int ProductId { get; set; }

        [Column("material_id")]
        public int MaterialId { get; set; }

        [Column("quantity")]
        public decimal Quantity { get; set; }

        [ForeignKey("ProductId")]
        public Product Product { get; set; }

        [ForeignKey("MaterialId")]
        public Material Material { get; set; }
    }
}