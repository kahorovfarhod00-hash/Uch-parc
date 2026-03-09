using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace uch_prac.Models
{
    [Table("product")]
    public class Product
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("article")]
        [Required]
        public string Article { get; set; }

        [Column("name")]
        [Required]
        public string Name { get; set; }

        [Column("type_id")]
        public int TypeId { get; set; }

        [Column("min_cost")]
        public decimal MinCost { get; set; }

        [Column("width")]
        public decimal Width { get; set; }

        [ForeignKey("TypeId")]
        public ProductType ProductType { get; set; }

        public ICollection<ProductMaterial> ProductMaterials { get; set; }
    }
}
