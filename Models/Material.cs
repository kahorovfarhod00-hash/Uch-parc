using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace uch_prac.Models
{
    [Table("material")]
    public class Material
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("name")]
        [Required]
        public string Name { get; set; }

        [Column("type_id")]
        public int TypeId { get; set; }

        [Column("unit_price")]
        public decimal UnitPrice { get; set; }

        [ForeignKey("TypeId")]
        public MaterialType MaterialType { get; set; }

        public ICollection<ProductMaterial> ProductMaterials { get; set; }
    }
}