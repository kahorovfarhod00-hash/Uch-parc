using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace uch_prac.Models
{
    [Table("product_type")]
    public class ProductType
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("name")]
        [Required]
        public string Name { get; set; }

        [Column("coefficient")]
        public decimal Coefficient { get; set; }

        public ICollection<Product> Products { get; set; }
    }
}