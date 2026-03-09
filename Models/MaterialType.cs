using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace uch_prac.Models
{
    [Table("material_type")]
    public class MaterialType
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("name")]
        [Required]
        public string Name { get; set; }

        [Column("defect_percent")]
        public decimal DefectPercent { get; set; }

        public ICollection<Material> Materials { get; set; }
    }
}