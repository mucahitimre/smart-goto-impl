namespace SmartGotoImpl.Fixtures.SingleImpl
{
    public interface IOnlyOne
    {
        string Hello();
    }

    public class OnlyOne : IOnlyOne
    {
        public string Hello() => "hi";
    }
}
