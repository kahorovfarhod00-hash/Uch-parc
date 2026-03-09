// Файл: Controllers/ProductApiController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using uch_prac.Data;
using uch_prac.Models;

namespace uch_prac.Controllers
{
    [Route("api/products")]
    [ApiController]
    public class ProductApiController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ProductApiController(AppDbContext db)
        {
            _db = db;
        }

        // GET /api/products — список всех продуктов
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _db.Products
                .Include(p => p.ProductType)
                .Include(p => p.ProductMaterials)
                    .ThenInclude(pm => pm.Material)
                        .ThenInclude(m => m.MaterialType)
                .Select(p => new
                {
                    id = p.Id,
                    article = p.Article,
                    name = p.Name,
                    type_id = p.TypeId,
                    type_name = p.ProductType.Name,
                    min_cost = p.MinCost,
                    width = p.Width,
                    materials = p.ProductMaterials.Select(pm => new
                    {
                        material_id = pm.MaterialId,
                        name = pm.Material.Name,
                        qty = pm.Quantity,
                        unit_price = pm.Material.UnitPrice
                    })
                })
                .ToListAsync();

            return Ok(products);
        }

        // GET /api/products/5 — один продукт
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(int id)
        {
            var p = await _db.Products
                .Include(p => p.ProductType)
                .Include(p => p.ProductMaterials)
                    .ThenInclude(pm => pm.Material)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (p == null) return NotFound();
            return Ok(p);
        }

        // POST /api/products — добавить продукт
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var product = new Product
            {
                Article = dto.Article,
                Name = dto.Name,
                TypeId = dto.TypeId,
                MinCost = dto.MinCost,
                Width = dto.Width
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            // Добавить материалы
            foreach (var m in dto.Materials)
            {
                _db.ProductMaterials.Add(new ProductMaterial
                {
                    ProductId = product.Id,
                    MaterialId = m.MaterialId,
                    Quantity = m.Qty
                });
            }

            await _db.SaveChangesAsync();
            return Ok(new { id = product.Id });
        }

        // PUT /api/products/5 — редактировать продукт
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductDto dto)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null) return NotFound();

            product.Article = dto.Article;
            product.Name = dto.Name;
            product.TypeId = dto.TypeId;
            product.MinCost = dto.MinCost;
            product.Width = dto.Width;

            // Удалить старые материалы
            var old = _db.ProductMaterials.Where(pm => pm.ProductId == id);
            _db.ProductMaterials.RemoveRange(old);

            // Добавить новые
            foreach (var m in dto.Materials)
            {
                _db.ProductMaterials.Add(new ProductMaterial
                {
                    ProductId = id,
                    MaterialId = m.MaterialId,
                    Quantity = m.Qty
                });
            }

            await _db.SaveChangesAsync();
            return Ok();
        }

        // DELETE /api/products/5 — удалить продукт
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null) return NotFound();

            _db.Products.Remove(product);
            await _db.SaveChangesAsync();
            return Ok();
        }

        // GET /api/products/types — список типов продукции
        [HttpGet("types")]
        public async Task<IActionResult> GetTypes()
        {
            var types = await _db.ProductTypes.ToListAsync();
            return Ok(types);
        }
    }

    // DTO для данных с сайта
    public class ProductDto
    {
        public string Article { get; set; }
        public string Name { get; set; }
        public int TypeId { get; set; }
        public decimal MinCost { get; set; }
        public decimal Width { get; set; }
        public List<MaterialDto> Materials { get; set; } = new();
    }

    public class MaterialDto
    {
        public int MaterialId { get; set; }
        public decimal Qty { get; set; }
    }
}