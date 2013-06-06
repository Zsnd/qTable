using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace qTable.Controllers
{
    public class HomeController : Controller
    {
        //
        // GET: /Home/
        static IList<Order> _orders = new List<Order>();

        static HomeController()
        {
            for (int i = 1; i < 501; i++)
            {
                var order = new Order
                    {
                        number = "row:" + i + " colmun:1",
                        date = "row:" + i + " colmun:2",
                        creator = "row:" + i + " colmun:3",
                        remark = "row:" + i + " colmun:4",
                    };
                _orders.Add(order);
            }
        }

        [HttpPost]
        public ActionResult Index(int pageindex, int pagesize, string sort, string sidx)
        {
            var data = _orders.Skip(pageindex*pagesize).Take(pagesize);
            var pager = new {pageindex = pageindex, pagesize = pagesize, total = _orders.Count};
            return Json(new
                {
                    data = data,
                    pager = pager
                });
        }

    }

    public class Order
    {
        public string number { get; set; }
        public string date { get; set; }
        public string creator { get; set; }
        public string remark { get; set; }
    }
}
