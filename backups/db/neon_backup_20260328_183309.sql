--
-- PostgreSQL database dump
--

\restrict pCWGjWoa7In1qCO3hrZOZ40ionHjMQo9kwuzKoZc01Hnn8gCYnXzduATHhj28n0

-- Dumped from database version 17.8 (a284a84)
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying NOT NULL,
    account character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    avatar character varying(500) DEFAULT ''::character varying,
    role_name character varying(50) DEFAULT '管理员'::character varying,
    role_id integer DEFAULT 0,
    dept_name character varying(100) DEFAULT ''::character varying,
    dept_id integer DEFAULT 0,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    status integer DEFAULT 1,
    remark text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.admins OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: collect_receipt; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.collect_receipt (
    id integer NOT NULL,
    receipt_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    contact_name character varying(100) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    receipt_date date,
    pay_type character varying(50) DEFAULT 'customer'::character varying,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.collect_receipt OWNER TO neondb_owner;

--
-- Name: collect_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.collect_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collect_receipt_id_seq OWNER TO neondb_owner;

--
-- Name: collect_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.collect_receipt_id_seq OWNED BY public.collect_receipt.id;


--
-- Name: company_info; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_info (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying,
    logo character varying(500) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    tel character varying(50) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text
);


ALTER TABLE public.company_info OWNER TO neondb_owner;

--
-- Name: company_info_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.company_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_info_id_seq OWNER TO neondb_owner;

--
-- Name: company_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.company_info_id_seq OWNED BY public.company_info.id;


--
-- Name: depts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.depts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer DEFAULT 0,
    sort integer DEFAULT 0,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.depts OWNER TO neondb_owner;

--
-- Name: depts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.depts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.depts_id_seq OWNER TO neondb_owner;

--
-- Name: depts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.depts_id_seq OWNED BY public.depts.id;


--
-- Name: finance_costs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_costs (
    id integer NOT NULL,
    cost_no character varying(100) DEFAULT ''::character varying,
    name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    cost_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_costs OWNER TO neondb_owner;

--
-- Name: finance_costs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_costs_id_seq OWNER TO neondb_owner;

--
-- Name: finance_costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_costs_id_seq OWNED BY public.finance_costs.id;


--
-- Name: finance_expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_expenses (
    id integer NOT NULL,
    expense_no character varying(100) DEFAULT ''::character varying,
    name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    expense_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_expenses OWNER TO neondb_owner;

--
-- Name: finance_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_expenses_id_seq OWNER TO neondb_owner;

--
-- Name: finance_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_expenses_id_seq OWNED BY public.finance_expenses.id;


--
-- Name: finance_funds; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_funds (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    fund_type integer DEFAULT 1,
    balance numeric(10,2) DEFAULT 0,
    bank_name character varying(100) DEFAULT ''::character varying,
    bank_account character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_funds OWNER TO neondb_owner;

--
-- Name: finance_funds_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_funds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_funds_id_seq OWNER TO neondb_owner;

--
-- Name: finance_funds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_funds_id_seq OWNED BY public.finance_funds.id;


--
-- Name: finance_invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_invoices (
    id integer NOT NULL,
    invoice_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    invoice_date date,
    type integer DEFAULT 1,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_invoices OWNER TO neondb_owner;

--
-- Name: finance_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_invoices_id_seq OWNER TO neondb_owner;

--
-- Name: finance_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_invoices_id_seq OWNED BY public.finance_invoices.id;


--
-- Name: finance_payable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_payable (
    id integer NOT NULL,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    order_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    un_pay_amount numeric(10,2) DEFAULT 0,
    due_date date,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_payable OWNER TO neondb_owner;

--
-- Name: finance_payable_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_payable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_payable_id_seq OWNER TO neondb_owner;

--
-- Name: finance_payable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_payable_id_seq OWNED BY public.finance_payable.id;


--
-- Name: finance_receivable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_receivable (
    id integer NOT NULL,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    total_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    un_pay_amount numeric(10,2) DEFAULT 0,
    due_date date,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_receivable OWNER TO neondb_owner;

--
-- Name: finance_receivable_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_receivable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_receivable_id_seq OWNER TO neondb_owner;

--
-- Name: finance_receivable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_receivable_id_seq OWNED BY public.finance_receivable.id;


--
-- Name: finance_statements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_statements (
    id integer NOT NULL,
    statement_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    start_date date,
    end_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_statements OWNER TO neondb_owner;

--
-- Name: finance_statements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_statements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_statements_id_seq OWNER TO neondb_owner;

--
-- Name: finance_statements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_statements_id_seq OWNED BY public.finance_statements.id;


--
-- Name: goods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying,
    code character varying(100) DEFAULT ''::character varying,
    cate_id integer DEFAULT 0,
    cate_name character varying(100) DEFAULT ''::character varying,
    unit_id integer DEFAULT 0,
    unit_name character varying(50) DEFAULT ''::character varying,
    brand_id integer DEFAULT 0,
    brand_name character varying(100) DEFAULT ''::character varying,
    spec text DEFAULT ''::text,
    price numeric(10,2) DEFAULT 0,
    cost numeric(10,2) DEFAULT 0,
    stock integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    max_stock integer DEFAULT 0,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    images text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    goods_name character varying(200) DEFAULT ''::character varying NOT NULL,
    goods_sn character varying(100) DEFAULT ''::character varying,
    en_name character varying(200) DEFAULT ''::character varying,
    goods_memo character varying(200) DEFAULT ''::character varying,
    goods_type integer DEFAULT 1,
    sell_price numeric(10,2) DEFAULT 0,
    cost_price numeric(10,2) DEFAULT 0,
    barcode character varying(100) DEFAULT ''::character varying,
    safe_min integer DEFAULT 0,
    safe_max integer DEFAULT 0,
    sort integer DEFAULT 0,
    make_time integer DEFAULT 0,
    can_sale integer DEFAULT 1,
    can_buy integer DEFAULT 1,
    can_make integer DEFAULT 1,
    can_outsource integer DEFAULT 1,
    multi_unit boolean DEFAULT false,
    multi_spec boolean DEFAULT false
);


ALTER TABLE public.goods OWNER TO neondb_owner;

--
-- Name: goods_brand; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_brand (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_brand OWNER TO neondb_owner;

--
-- Name: goods_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_brand_id_seq OWNER TO neondb_owner;

--
-- Name: goods_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_brand_id_seq OWNED BY public.goods_brand.id;


--
-- Name: goods_cate; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_cate (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer DEFAULT 0,
    sort integer DEFAULT 0,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_cate OWNER TO neondb_owner;

--
-- Name: goods_cate_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_cate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_cate_id_seq OWNER TO neondb_owner;

--
-- Name: goods_cate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_cate_id_seq OWNED BY public.goods_cate.id;


--
-- Name: goods_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_id_seq OWNER TO neondb_owner;

--
-- Name: goods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_id_seq OWNED BY public.goods.id;


--
-- Name: goods_spec; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_spec (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    "values" text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_spec OWNER TO neondb_owner;

--
-- Name: goods_spec_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_spec_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_spec_id_seq OWNER TO neondb_owner;

--
-- Name: goods_spec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_spec_id_seq OWNED BY public.goods_spec.id;


--
-- Name: goods_unit; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_unit (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_unit OWNER TO neondb_owner;

--
-- Name: goods_unit_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_unit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_unit_id_seq OWNER TO neondb_owner;

--
-- Name: goods_unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_unit_id_seq OWNED BY public.goods_unit.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    dept_id integer DEFAULT 0,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.jobs OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: operation_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.operation_logs (
    id integer NOT NULL,
    admin_id integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    action character varying(200) DEFAULT ''::character varying,
    ip character varying(50) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.operation_logs OWNER TO neondb_owner;

--
-- Name: operation_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.operation_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operation_logs_id_seq OWNER TO neondb_owner;

--
-- Name: operation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.operation_logs_id_seq OWNED BY public.operation_logs.id;


--
-- Name: pay_receipt; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pay_receipt (
    id integer NOT NULL,
    receipt_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    contact_type character varying(50) DEFAULT 'supplier'::character varying,
    contact_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    pay_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.pay_receipt OWNER TO neondb_owner;

--
-- Name: pay_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pay_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pay_receipt_id_seq OWNER TO neondb_owner;

--
-- Name: pay_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pay_receipt_id_seq OWNED BY public.pay_receipt.id;


--
-- Name: prepay_record; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prepay_record (
    id integer NOT NULL,
    order_sn character varying(100) DEFAULT ''::character varying,
    pay_type character varying(50) DEFAULT 'customer'::character varying,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    pay_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.prepay_record OWNER TO neondb_owner;

--
-- Name: prepay_record_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.prepay_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prepay_record_id_seq OWNER TO neondb_owner;

--
-- Name: prepay_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.prepay_record_id_seq OWNED BY public.prepay_record.id;


--
-- Name: procure_inhouse; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_inhouse (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    purchase_order_id integer DEFAULT 0,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    in_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_inhouse OWNER TO neondb_owner;

--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_inhouse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_inhouse_id_seq OWNER TO neondb_owner;

--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_inhouse_id_seq OWNED BY public.procure_inhouse.id;


--
-- Name: procure_plan; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_plan (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    plan_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_plan OWNER TO neondb_owner;

--
-- Name: procure_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_plan_id_seq OWNER TO neondb_owner;

--
-- Name: procure_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_plan_id_seq OWNED BY public.procure_plan.id;


--
-- Name: procure_return; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_return (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    order_id integer DEFAULT 0,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    return_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    fund_id integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_return OWNER TO neondb_owner;

--
-- Name: procure_return_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_return_id_seq OWNER TO neondb_owner;

--
-- Name: procure_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_return_id_seq OWNED BY public.procure_return.id;


--
-- Name: purchase_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    order_date date,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    freight_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.purchase_order OWNER TO neondb_owner;

--
-- Name: purchase_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.purchase_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_id_seq OWNER TO neondb_owner;

--
-- Name: purchase_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.purchase_order_id_seq OWNED BY public.purchase_order.id;


--
-- Name: retail_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_members (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    gender integer DEFAULT 0,
    birthday date,
    balance numeric(10,2) DEFAULT 0,
    points integer DEFAULT 0,
    level character varying(50) DEFAULT '普通会员'::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_members OWNER TO neondb_owner;

--
-- Name: retail_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_members_id_seq OWNER TO neondb_owner;

--
-- Name: retail_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_members_id_seq OWNED BY public.retail_members.id;


--
-- Name: retail_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_orders (
    id integer NOT NULL,
    order_sn character varying(100) DEFAULT ''::character varying,
    member_id integer DEFAULT 0,
    member_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    pay_type character varying(50) DEFAULT ''::character varying,
    order_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_orders OWNER TO neondb_owner;

--
-- Name: retail_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_orders_id_seq OWNER TO neondb_owner;

--
-- Name: retail_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_orders_id_seq OWNED BY public.retail_orders.id;


--
-- Name: retail_recharge; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_recharge (
    id integer NOT NULL,
    recharge_no character varying(100) DEFAULT ''::character varying,
    member_id integer DEFAULT 0,
    member_name character varying(100) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_recharge OWNER TO neondb_owner;

--
-- Name: retail_recharge_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_recharge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_recharge_id_seq OWNER TO neondb_owner;

--
-- Name: retail_recharge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_recharge_id_seq OWNED BY public.retail_recharge.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    permissions text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sale_contracts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_contracts (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    order_date date,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_contracts OWNER TO neondb_owner;

--
-- Name: sale_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_contracts_id_seq OWNER TO neondb_owner;

--
-- Name: sale_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_contracts_id_seq OWNED BY public.sale_contracts.id;


--
-- Name: sale_customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_customers (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    nickname character varying(100) DEFAULT ''::character varying,
    code character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    tel character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    contact character varying(100) DEFAULT ''::character varying,
    level_name character varying(50) DEFAULT '普通客户'::character varying,
    source_name character varying(50) DEFAULT ''::character varying,
    level_id integer DEFAULT 0,
    source_id integer DEFAULT 0,
    follow_admin_id integer DEFAULT 0,
    follow_admin character varying(50) DEFAULT ''::character varying,
    balance numeric(10,2) DEFAULT 0,
    is_sea integer DEFAULT 0,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_customers OWNER TO neondb_owner;

--
-- Name: sale_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_customers_id_seq OWNER TO neondb_owner;

--
-- Name: sale_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_customers_id_seq OWNED BY public.sale_customers.id;


--
-- Name: sale_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_offers (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    offer_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_offers OWNER TO neondb_owner;

--
-- Name: sale_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_offers_id_seq OWNER TO neondb_owner;

--
-- Name: sale_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_offers_id_seq OWNED BY public.sale_offers.id;


--
-- Name: sale_out_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_out_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    out_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_out_order OWNER TO neondb_owner;

--
-- Name: sale_out_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_out_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_out_order_id_seq OWNER TO neondb_owner;

--
-- Name: sale_out_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_out_order_id_seq OWNED BY public.sale_out_order.id;


--
-- Name: sale_return_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_return_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    return_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_return_order OWNER TO neondb_owner;

--
-- Name: sale_return_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_return_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_return_order_id_seq OWNER TO neondb_owner;

--
-- Name: sale_return_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_return_order_id_seq OWNED BY public.sale_return_order.id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    dept_id integer DEFAULT 0,
    dept_name character varying(100) DEFAULT ''::character varying,
    job_id integer DEFAULT 0,
    job_name character varying(100) DEFAULT ''::character varying,
    entry_date date,
    gender integer DEFAULT 1,
    status integer DEFAULT 1,
    remark text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_id_seq OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- Name: stock_checks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_checks (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_checks OWNER TO neondb_owner;

--
-- Name: stock_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_checks_id_seq OWNER TO neondb_owner;

--
-- Name: stock_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_checks_id_seq OWNED BY public.stock_checks.id;


--
-- Name: stock_flow; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_flow (
    id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    type character varying(50) DEFAULT ''::character varying,
    qty integer DEFAULT 0,
    before_qty integer DEFAULT 0,
    after_qty integer DEFAULT 0,
    order_no character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_flow OWNER TO neondb_owner;

--
-- Name: stock_flow_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_flow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_flow_id_seq OWNER TO neondb_owner;

--
-- Name: stock_flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_flow_id_seq OWNED BY public.stock_flow.id;


--
-- Name: stock_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_inventory (
    id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    goods_code character varying(100) DEFAULT ''::character varying,
    unit_name character varying(50) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    qty integer DEFAULT 0,
    cost numeric(10,2) DEFAULT 0,
    update_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_inventory OWNER TO neondb_owner;

--
-- Name: stock_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: stock_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_inventory_id_seq OWNED BY public.stock_inventory.id;


--
-- Name: stock_other_in; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_other_in (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_other_in OWNER TO neondb_owner;

--
-- Name: stock_other_in_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_other_in_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_other_in_id_seq OWNER TO neondb_owner;

--
-- Name: stock_other_in_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_other_in_id_seq OWNED BY public.stock_other_in.id;


--
-- Name: stock_other_out; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_other_out (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_other_out OWNER TO neondb_owner;

--
-- Name: stock_other_out_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_other_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_other_out_id_seq OWNER TO neondb_owner;

--
-- Name: stock_other_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_other_out_id_seq OWNED BY public.stock_other_out.id;


--
-- Name: supplier; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.supplier (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    contact character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    bank character varying(100) DEFAULT ''::character varying,
    bank_account character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.supplier OWNER TO neondb_owner;

--
-- Name: supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_id_seq OWNER TO neondb_owner;

--
-- Name: supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.supplier_id_seq OWNED BY public.supplier.id;


--
-- Name: sys_params; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sys_params (
    id integer NOT NULL,
    key character varying(100),
    value text DEFAULT ''::text,
    remark text DEFAULT ''::text
);


ALTER TABLE public.sys_params OWNER TO neondb_owner;

--
-- Name: sys_params_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sys_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_params_id_seq OWNER TO neondb_owner;

--
-- Name: sys_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sys_params_id_seq OWNED BY public.sys_params.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    address text DEFAULT ''::text,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.warehouses OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: collect_receipt id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collect_receipt ALTER COLUMN id SET DEFAULT nextval('public.collect_receipt_id_seq'::regclass);


--
-- Name: company_info id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_info ALTER COLUMN id SET DEFAULT nextval('public.company_info_id_seq'::regclass);


--
-- Name: depts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.depts ALTER COLUMN id SET DEFAULT nextval('public.depts_id_seq'::regclass);


--
-- Name: finance_costs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_costs ALTER COLUMN id SET DEFAULT nextval('public.finance_costs_id_seq'::regclass);


--
-- Name: finance_expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_expenses ALTER COLUMN id SET DEFAULT nextval('public.finance_expenses_id_seq'::regclass);


--
-- Name: finance_funds id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_funds ALTER COLUMN id SET DEFAULT nextval('public.finance_funds_id_seq'::regclass);


--
-- Name: finance_invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_invoices ALTER COLUMN id SET DEFAULT nextval('public.finance_invoices_id_seq'::regclass);


--
-- Name: finance_payable id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_payable ALTER COLUMN id SET DEFAULT nextval('public.finance_payable_id_seq'::regclass);


--
-- Name: finance_receivable id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_receivable ALTER COLUMN id SET DEFAULT nextval('public.finance_receivable_id_seq'::regclass);


--
-- Name: finance_statements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_statements ALTER COLUMN id SET DEFAULT nextval('public.finance_statements_id_seq'::regclass);


--
-- Name: goods id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods ALTER COLUMN id SET DEFAULT nextval('public.goods_id_seq'::regclass);


--
-- Name: goods_brand id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_brand ALTER COLUMN id SET DEFAULT nextval('public.goods_brand_id_seq'::regclass);


--
-- Name: goods_cate id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_cate ALTER COLUMN id SET DEFAULT nextval('public.goods_cate_id_seq'::regclass);


--
-- Name: goods_spec id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_spec ALTER COLUMN id SET DEFAULT nextval('public.goods_spec_id_seq'::regclass);


--
-- Name: goods_unit id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit ALTER COLUMN id SET DEFAULT nextval('public.goods_unit_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: operation_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operation_logs ALTER COLUMN id SET DEFAULT nextval('public.operation_logs_id_seq'::regclass);


--
-- Name: pay_receipt id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pay_receipt ALTER COLUMN id SET DEFAULT nextval('public.pay_receipt_id_seq'::regclass);


--
-- Name: prepay_record id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prepay_record ALTER COLUMN id SET DEFAULT nextval('public.prepay_record_id_seq'::regclass);


--
-- Name: procure_inhouse id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_inhouse ALTER COLUMN id SET DEFAULT nextval('public.procure_inhouse_id_seq'::regclass);


--
-- Name: procure_plan id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_plan ALTER COLUMN id SET DEFAULT nextval('public.procure_plan_id_seq'::regclass);


--
-- Name: procure_return id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_return ALTER COLUMN id SET DEFAULT nextval('public.procure_return_id_seq'::regclass);


--
-- Name: purchase_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_id_seq'::regclass);


--
-- Name: retail_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_members ALTER COLUMN id SET DEFAULT nextval('public.retail_members_id_seq'::regclass);


--
-- Name: retail_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_orders ALTER COLUMN id SET DEFAULT nextval('public.retail_orders_id_seq'::regclass);


--
-- Name: retail_recharge id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_recharge ALTER COLUMN id SET DEFAULT nextval('public.retail_recharge_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sale_contracts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_contracts ALTER COLUMN id SET DEFAULT nextval('public.sale_contracts_id_seq'::regclass);


--
-- Name: sale_customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_customers ALTER COLUMN id SET DEFAULT nextval('public.sale_customers_id_seq'::regclass);


--
-- Name: sale_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_offers ALTER COLUMN id SET DEFAULT nextval('public.sale_offers_id_seq'::regclass);


--
-- Name: sale_out_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_out_order ALTER COLUMN id SET DEFAULT nextval('public.sale_out_order_id_seq'::regclass);


--
-- Name: sale_return_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_return_order ALTER COLUMN id SET DEFAULT nextval('public.sale_return_order_id_seq'::regclass);


--
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);


--
-- Name: stock_checks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_checks ALTER COLUMN id SET DEFAULT nextval('public.stock_checks_id_seq'::regclass);


--
-- Name: stock_flow id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_flow ALTER COLUMN id SET DEFAULT nextval('public.stock_flow_id_seq'::regclass);


--
-- Name: stock_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_inventory ALTER COLUMN id SET DEFAULT nextval('public.stock_inventory_id_seq'::regclass);


--
-- Name: stock_other_in id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_in ALTER COLUMN id SET DEFAULT nextval('public.stock_other_in_id_seq'::regclass);


--
-- Name: stock_other_out id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_out ALTER COLUMN id SET DEFAULT nextval('public.stock_other_out_id_seq'::regclass);


--
-- Name: supplier id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier ALTER COLUMN id SET DEFAULT nextval('public.supplier_id_seq'::regclass);


--
-- Name: sys_params id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params ALTER COLUMN id SET DEFAULT nextval('public.sys_params_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admins (id, name, account, password, avatar, role_name, role_id, dept_name, dept_id, mobile, email, status, remark, create_time, update_time, deleted_at) FROM stdin;
1	管理员	17747344571	Oral6421		超级管理员	0		0			1		2026-03-28 12:40:01.408684	2026-03-28 12:40:01.408684	\N
2	管理员	admin	123456		超级管理员	0		0			1		2026-03-28 13:04:00.311975	2026-03-28 13:04:00.311975	\N
\.


--
-- Data for Name: collect_receipt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.collect_receipt (id, receipt_no, order_sn, customer_id, customer_name, contact_name, amount, receipt_date, pay_type, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: company_info; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_info (id, name, logo, address, tel, email, remark) FROM stdin;
1	我的公司					
\.


--
-- Data for Name: depts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.depts (id, name, parent_id, sort, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_costs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_costs (id, cost_no, name, amount, cost_date, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_expenses (id, expense_no, name, amount, expense_date, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_funds; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_funds (id, name, fund_type, balance, bank_name, bank_account, remark, status, create_time, update_time, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_invoices (id, invoice_no, customer_id, customer_name, amount, invoice_date, type, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_payable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_payable (id, supplier_id, supplier_name, order_sn, order_amount, paid_amount, un_pay_amount, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_receivable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_receivable (id, customer_id, customer_name, order_sn, total_amount, paid_amount, un_pay_amount, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_statements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_statements (id, statement_no, customer_id, customer_name, amount, start_date, end_date, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: goods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods (id, name, code, cate_id, cate_name, unit_id, unit_name, brand_id, brand_name, spec, price, cost, stock, min_stock, max_stock, remark, status, images, create_time, update_time, deleted_at, goods_name, goods_sn, en_name, goods_memo, goods_type, sell_price, cost_price, barcode, safe_min, safe_max, sort, make_time, can_sale, can_buy, can_make, can_outsource, multi_unit, multi_spec) FROM stdin;
4			0		0		0			0.00	0.00	0	0	0		1		2026-03-28 16:48:45.633885	2026-03-28 16:48:45.633885	2026-03-28 17:26:28.390424	测试商品	TEST001			1	99.90	50.00		0	0	0	0	1	1	1	1	f	f
5			34	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-28 17:26:43.953044	2026-03-28 17:26:43.953044	\N	炒米/散/巴林	SP0000233			1	7.00	0.00		0	0	0	0	1	1	1	1	f	f
6			34	广告物料	0	瓶	0		1L	0.00	0.00	0	0	0		1		2026-03-28 17:26:44.552964	2026-03-28 17:26:44.552964	\N	德吉酸奶/2斤装	SP0000232			1	18.00	15.00	6900002324565	0	0	0	0	1	1	1	1	f	f
7			34	广告物料	0	瓶	0		500mL	0.00	0.00	0	0	0		1		2026-03-28 17:26:44.979395	2026-03-28 17:26:44.979395	\N	德吉酸奶/一斤装	SP0000231			1	12.00	8.00	6954129710171	0	0	0	0	1	1	1	1	f	f
9			34	广告物料	0	瓶	0		250mL	0.00	0.00	0	0	0		1		2026-03-28 17:26:45.405826	2026-03-28 17:26:45.405826	\N	德吉酸奶/半斤	SP0000230			1	8.00	4.00		0	0	0	0	1	1	1	1	f	f
13			37	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-28 17:26:47.1074	2026-03-28 17:26:47.1074	\N	蒙古果/格日勒/大	SP0000229			1	16.00	12.00	6926743385045	0	0	0	0	1	1	1	1	f	f
15			34	广告物料	0	盒	0		100克	0.00	0.00	0	0	0		1		2026-03-28 17:26:47.529441	2026-03-28 17:26:47.529441	\N	彩色奶圈圈	SP0000228			1	15.00	0.00		0	0	0	0	1	1	1	1	f	f
17			37	成品	0	盒	0		10斤装	0.00	0.00	0	0	0		1		2026-03-28 17:26:47.968645	2026-03-28 17:26:47.968645	\N	10斤装/小米/绿色纸盒	SP0000227			1	70.00	65.00		0	0	0	0	1	1	1	1	f	f
19			35	散货	0	散	0		1斤装	0.00	0.00	0	0	0		1		2026-03-28 17:26:48.397823	2026-03-28 17:26:48.397823	\N	乌日莫/奥特尔	SP0000226			1	15.00	12.00		0	0	0	0	1	1	1	1	f	f
21			34	广告物料	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-28 17:26:48.817572	2026-03-28 17:26:48.817572	\N	蒙古果子/格日勒	SP0000225			1	10.00	8.00		0	0	0	0	1	1	1	1	f	f
23			34	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-28 17:26:49.24351	2026-03-28 17:26:49.24351	\N	花形奶锅巴	SP0000224			1	35.00	0.00		0	0	0	0	1	1	1	1	f	f
25			34	广告物料	0	张	0		大	0.00	0.00	0	0	0		1		2026-03-28 17:26:49.680124	2026-03-28 17:26:49.680124	\N	奶豆腐/超大/乌日汗	SP0000223			1	85.00	60.00	6900002239603	0	0	0	0	1	1	1	1	f	f
27			34	广告物料	0	袋	0		1斤/原味	0.00	0.00	0	0	0		1		2026-03-28 17:26:50.108181	2026-03-28 17:26:50.108181	\N	奥都/真空奶豆腐	SP0000222			1	25.00	0.00		0	0	0	0	1	1	1	1	f	f
29			37	成品	0	瓶	0		大	0.00	0.00	0	0	0		1		2026-03-28 17:26:50.535213	2026-03-28 17:26:50.535213	\N	酸马奶	SP0000221			1	25.00	15.00	6900002213934	0	0	0	0	1	1	1	1	f	f
31			37	成品	0	瓶	0		大	0.00	0.00	0	0	0		1		2026-03-28 17:26:50.955556	2026-03-28 17:26:50.955556	\N	乌日汗大瓶酸奶	SP0000220			1	20.00	16.00	6900002209130	0	0	0	0	1	1	1	1	f	f
33			37	成品	0	瓶	0		小	0.00	0.00	0	0	0		1		2026-03-28 17:26:51.379703	2026-03-28 17:26:51.379703	\N	乌日汗小瓶酸奶	SP0000219			1	8.00	6.00	6903547102122	0	0	0	0	1	1	1	1	f	f
35			39	酒	0	件	0		500ML*4	0.00	0.00	0	0	0		1		2026-03-28 17:26:52.229159	2026-03-28 17:26:52.229159	\N	四季红福	SP0000218			1	120.00	100.00		0	0	0	0	1	1	1	1	f	f
37			39	酒	0	桶	0		2L	0.00	0.00	0	0	0		1		2026-03-28 17:26:52.660145	2026-03-28 17:26:52.660145	\N	红日桶装酒	SP0000217			1	28.00	21.00		0	0	0	0	1	1	1	1	f	f
39			39	酒	0	瓶	0		490mL	0.00	0.00	0	0	0		1		2026-03-28 17:26:53.089563	2026-03-28 17:26:53.089563	\N	天山原浆/小	SP0000216			1	15.00	9.23	6900002169910	0	0	0	0	1	1	1	1	f	f
41			39	酒	0	瓶	0		490mL	0.00	0.00	0	0	0		1		2026-03-28 17:26:53.515139	2026-03-28 17:26:53.515139	\N	天山原浆/大	SP0000215			1	25.00	16.05	6926919861169	0	0	0	0	1	1	1	1	f	f
43			34	广告物料	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-28 17:26:53.939019	2026-03-28 17:26:53.939019	\N	黄油/大瓶/科尔沁	SP0000214			1	30.00	21.00	6907262383018	0	0	0	0	1	1	1	1	f	f
45			34	广告物料	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-28 17:26:54.377245	2026-03-28 17:26:54.377245	\N	黄油/中瓶	SP0000213			1	25.00	15.00		0	0	0	0	1	1	1	1	f	f
47			41	散装	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-28 17:26:55.217517	2026-03-28 17:26:55.217517	\N	黄油/散装	SP0000212			1	48.00	22.00		0	0	0	0	1	1	1	1	f	f
49			41	散装	0	盒	0		300ml	0.00	0.00	0	0	0		1		2026-03-28 17:26:55.63745	2026-03-28 17:26:55.63745	\N	故乡宝酸马奶	SP0000211			1	18.00	15.00		0	0	0	0	1	1	1	1	f	f
51			41	散装	0	盒	0		500克	0.00	0.00	0	0	0		1		2026-03-28 17:26:56.074359	2026-03-28 17:26:56.074359	\N	乌日汗酸奶	SP0000210			1	15.00	9.00	6900002102839	0	0	0	0	1	1	1	1	f	f
53			47	成品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-28 17:26:57.775189	2026-03-28 17:26:57.775189	\N	透明成品/奶锅巴/线下	SP0000209			1	27.00	0.00		0	0	0	0	1	1	1	1	f	f
55			34	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:26:58.21222	2026-03-28 17:26:58.21222	\N	中等/奶豆腐/	SP0000208			1	32.00	0.00		0	0	0	0	1	1	1	1	f	f
57			34	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:26:58.636812	2026-03-28 17:26:58.636812	\N	奶豆腐/原味/中/科尔沁	SP0000207			1	25.00	19.00		0	0	0	0	1	1	1	1	f	f
59			34	广告物料	0	袋	0		2.5kg	0.00	0.00	0	0	0		1		2026-03-28 17:26:59.067414	2026-03-28 17:26:59.067414	\N	小米/10斤/小袋	SP0000206			1	22.00	19.00		0	0	0	0	1	1	1	1	f	f
61			37	成品	0	袋	0		1斤装	0.00	0.00	0	0	0		1		2026-03-28 17:26:59.499493	2026-03-28 17:26:59.499493	\N	果条/阿润	SP0000205			1	12.00	10.00		0	0	0	0	1	1	1	1	f	f
63			34	广告物料	0	袋	0		100克	0.00	0.00	0	0	0		1		2026-03-28 17:26:59.927742	2026-03-28 17:26:59.927742	\N	8元烤奶皮/成品	SP0000204			1	8.00	0.00		0	0	0	0	1	1	1	1	f	f
65			37	成品	0	袋	0		180	0.00	0.00	0	0	0		1		2026-03-28 17:27:00.359199	2026-03-28 17:27:00.359199	\N	10元/脆香奶条	SP0000203			1	10.00	0.00		0	0	0	0	1	1	1	1	f	f
67			34	广告物料	0	袋	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:00.787652	2026-03-28 17:27:00.787652	\N	新年福字袋/小	SP0000202			1	0.00	0.22		0	0	0	0	1	1	1	1	f	f
69			37	成品	0	散	0		散装	0.00	0.00	0	0	0		1		2026-03-28 17:27:01.221014	2026-03-28 17:27:01.221014	\N	奶果子/小包装/成品	SP0000200			1	50.00	0.00		0	0	0	0	1	1	1	1	f	f
71			53	塑料袋	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:02.953527	2026-03-28 17:27:02.953527	\N	礼盒/2026	SP0000199			1	8.00	5.16		0	0	0	0	1	1	1	1	f	f
73			41	散装	0	袋	0		1一斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:03.384771	2026-03-28 17:27:03.384771	\N	甜味奶豆腐块儿/大	SP0000198			1	35.00	28.00		0	0	0	0	1	1	1	1	f	f
75			57	成品	0	袋	0		2斤装	0.00	0.00	0	0	0		1		2026-03-28 17:27:04.718422	2026-03-28 17:27:04.718422	\N	奶粉蒙古国	SP0000197			1	36.00	32.00		0	0	0	0	1	1	1	1	f	f
77			57	成品	0	袋	0		360克	0.00	0.00	0	0	0		1		2026-03-28 17:27:05.144087	2026-03-28 17:27:05.144087	\N	奶皮子粉	SP0000196			1	16.00	12.00		0	0	0	0	1	1	1	1	f	f
79			57	成品	0	盒	0		300克	0.00	0.00	0	0	0		1		2026-03-28 17:27:05.57114	2026-03-28 17:27:05.57114	\N	奶茶粉战粮	SP0000195			1	20.00	15.00		0	0	0	0	1	1	1	1	f	f
81			57	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-28 17:27:06.006795	2026-03-28 17:27:06.006795	\N	奶茶粉贡格尔	SP0000194			1	22.00	18.00		0	0	0	0	1	1	1	1	f	f
83			57	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-28 17:27:06.440681	2026-03-28 17:27:06.440681	\N	努德勒沁调和茶	SP0000193			1	25.00	22.00		0	0	0	0	1	1	1	1	f	f
85			41	散装	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-28 17:27:06.870021	2026-03-28 17:27:06.870021	\N	阿依古丽奶茶专用红茶	SP0000192			1	0.00	0.00		0	0	0	0	1	1	1	1	f	f
87			57	成品	0	盒	0		400克	0.00	0.00	0	0	0		1		2026-03-28 17:27:07.292971	2026-03-28 17:27:07.292971	\N	希日嘎拉奶茶专用茶	SP0000191			1	25.00	22.00		0	0	0	0	1	1	1	1	f	f
89			34	广告物料	0	瓶	0		250克	0.00	0.00	0	0	0		1		2026-03-28 17:27:07.719411	2026-03-28 17:27:07.719411	\N	乳清饮料	SP0000190			1	6.00	4.50	6943774380698	0	0	0	0	1	1	1	1	f	f
91			34	广告物料	0	瓶	0		250克	0.00	0.00	0	0	0		1		2026-03-28 17:27:08.152815	2026-03-28 17:27:08.152815	\N	酸奶/额吉伊德	SP0000189			1	10.00	6.00		0	0	0	0	1	1	1	1	f	f
93			37	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-28 17:27:08.581679	2026-03-28 17:27:08.581679	\N	乌日莫/袋装	SP0000188			1	10.00	7.00		0	0	0	0	1	1	1	1	f	f
95			59	糖果sugar	0	袋	0		净含量172	0.00	0.00	0	0	0		1		2026-03-28 17:27:09.449375	2026-03-28 17:27:09.449375	\N	10元组合糖	SP0000187			1	10.00	6.00	6945391354769	0	0	0	0	1	1	1	1	f	f
97			59	糖果sugar	0	袋	0		净含量172	0.00	0.00	0	0	0		1		2026-03-28 17:27:09.881021	2026-03-28 17:27:09.881021	\N	15元组合糖	SP0000186			1	15.00	8.60		0	0	0	0	1	1	1	1	f	f
99			65	袋子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:11.619782	2026-03-28 17:27:11.619782	\N	红糖袋/delicious	SP0000185			1	0.00	0.00		0	0	0	0	1	1	1	1	f	f
101			37	成品	0	盒	0		3根	0.00	0.00	0	0	0		1		2026-03-28 17:27:12.049769	2026-03-28 17:27:12.049769	\N	晴王糖葫芦	SP0000184			1	0.00	0.00	6957075066268	0	0	0	0	1	1	1	1	f	f
103			37	成品	0	斤	0		孜然	0.00	0.00	0	0	0		1		2026-03-28 17:27:12.483739	2026-03-28 17:27:12.483739	\N	牛肉干/散/孜然	SP0000183			1	115.00	98.00	6961257264978	0	0	0	0	1	1	1	1	f	f
105			37	成品	0	斤	0		香辣	0.00	0.00	0	0	0		1		2026-03-28 17:27:12.901841	2026-03-28 17:27:12.901841	\N	牛肉干/散/香辣	SP0000182			1	115.00	98.00	6900002054622	0	0	0	0	1	1	1	1	f	f
107			37	成品	0	斤	0		原味	0.00	0.00	0	0	0		1		2026-03-28 17:27:13.323235	2026-03-28 17:27:13.323235	\N	牛肉干/散/原味	SP0000181			1	115.00	98.00	6939980951432	0	0	0	0	1	1	1	1	f	f
109			34	广告物料	0	散	0		散	0.00	0.00	0	0	0		1		2026-03-28 17:27:13.751309	2026-03-28 17:27:13.751309	\N	奶锅巴/扎旗吉十奶制品	SP0000180			1	28.00	18.00	6937111207251	0	0	0	0	1	1	1	1	f	f
111			37	成品	0	张	0		1.2	0.00	0.00	0	0	0		1		2026-03-28 17:27:14.180568	2026-03-28 17:27:14.180568	\N	科尔沁/大奶豆腐	SP0000179			1	48.00	33.00	6974218180685	0	0	0	0	1	1	1	1	f	f
113			34	广告物料	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:14.61209	2026-03-28 17:27:14.61209	\N	厚奶皮	SP0000178			1	25.00	19.00		0	0	0	0	1	1	1	1	f	f
115			37	成品	0	盒	0		3棵	0.00	0.00	0	0	0		1		2026-03-28 17:27:15.03673	2026-03-28 17:27:15.03673	\N	糖葫芦	SP0000177			1	10.00	6.00	6963465779827	0	0	0	0	1	1	1	1	f	f
117			59	糖果sugar	0	斤	0		奶油炒米/  黑芝麻/ 乌日莫糖/ 酸奶炒米/ 奶油花生	0.00	0.00	0	0	0		1		2026-03-28 17:27:15.458758	2026-03-28 17:27:15.458758	\N	糖/阿润	SP0000176			1	35.00	25.00		0	0	0	0	1	1	1	1	f	f
119			41	散装	0	散	0		散称	0.00	0.00	0	0	0		1		2026-03-28 17:27:15.918539	2026-03-28 17:27:15.918539	\N	普通瓜子	SP0000175			1	12.00	10.00	6915044718067	0	0	0	0	1	1	1	1	f	f
121			41	散装	0	散	0		散称	0.00	0.00	0	0	0		1		2026-03-28 17:27:16.34926	2026-03-28 17:27:16.34926	\N	五香瓜子	SP0000174			1	18.00	15.00	6900001763790	0	0	0	0	1	1	1	1	f	f
123			71	黄油	0	瓶	0		120mL	0.00	0.00	0	0	0		1		2026-03-28 17:27:18.456103	2026-03-28 17:27:18.456103	\N	专瓶/黄油渣	SP0000173			1	0.00	1.80		0	0	0	0	1	1	1	1	f	f
125			41	散装	0	个	0		7克/包	0.00	0.00	0	0	0		1		2026-03-28 17:27:18.977739	2026-03-28 17:27:18.977739	\N	冻炒米/小包散/精品	SP0000172			1	0.00	0.22	6922984070163	0	0	0	0	1	1	1	1	f	f
127			53	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:19.39785	2026-03-28 17:27:19.39785	\N	礼盒/腰封	SP0000171			1	0.50	0.37		0	0	0	0	1	1	1	1	f	f
129			37	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-28 17:27:19.817284	2026-03-28 17:27:19.817284	\N	牛肉干/和希格图	SP0000170			1	89.00	49.00	6906087912087	0	0	0	0	1	1	1	1	f	f
131			37	成品	0	瓶	0		400ke	0.00	0.00	0	0	0		1		2026-03-28 17:27:20.240218	2026-03-28 17:27:20.240218	\N	酸奶/纯净	SP0000169			1	12.00	6.00		0	0	0	0	1	1	1	1	f	f
133			57	成品	0	盒	0		5g/袋泡茶/30泡	0.00	0.00	0	0	0		1		2026-03-28 17:27:20.671036	2026-03-28 17:27:20.671036	\N	5g/青砖袋泡茶	SP0000168			1	28.00	7.96	6980240258574	0	0	0	0	1	1	1	1	f	f
135			57	成品	0	袋	0		450g/25袋	0.00	0.00	0	0	0		1		2026-03-28 17:27:21.095203	2026-03-28 17:27:21.095203	\N	16g青砖袋泡茶	SP0000167			1	18.00	10.24	6974109183959	0	0	0	0	1	1	1	1	f	f
137			57	成品	0	袋	0		450g	0.00	0.00	0	0	0		1		2026-03-28 17:27:21.525649	2026-03-28 17:27:21.525649	\N	青砖碎茶	SP0000166			1	12.00	7.31		0	0	0	0	1	1	1	1	f	f
139			57	成品	0	个	0		1.5kg	0.00	0.00	0	0	0		1		2026-03-28 17:27:21.949416	2026-03-28 17:27:21.949416	\N	大青砖茶砖	SP0000165			1	35.00	22.75	6910261376045	0	0	0	0	1	1	1	1	f	f
141			57	成品	0	个	0		380g	0.00	0.00	0	0	0		1		2026-03-28 17:27:22.379715	2026-03-28 17:27:22.379715	\N	小青砖茶砖	SP0000164			1	12.00	7.11	6928141402320	0	0	0	0	1	1	1	1	f	f
143			75	半成品	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-28 17:27:23.671466	2026-03-28 17:27:23.671466	\N	半成品/黄金纬度牛肉干/那牧尔	SP0000163			2	88.00	41.44	6973457825186	0	0	0	0	1	1	1	1	f	f
145			81	牛肉干	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-28 17:27:25.388238	2026-03-28 17:27:25.388238	\N	专袋/牛肉干包装	SP0000162			1	0.00	1.47	6980832219752	0	0	0	0	1	1	1	1	f	f
147			83	成品	0	袋	0		140克	0.00	0.00	0	0	0		1		2026-03-28 17:27:26.246821	2026-03-28 17:27:26.246821	\N	黄金纬度/牛肉干/成品袋	SP0000161			1	118.00	48.95		0	0	0	0	1	1	1	1	f	f
149			89	定制类产品	0	盒	0		140g	0.00	0.00	0	0	0		1		2026-03-28 17:27:27.962098	2026-03-28 17:27:27.962098	\N	憨野/冻炒米	SP0000160			1	23.50	4.48	6993375937417	0	0	0	0	1	1	1	1	f	f
151			89	定制类产品	0	盒	0		120g	0.00	0.00	0	0	0		1		2026-03-28 17:27:28.396897	2026-03-28 17:27:28.396897	\N	憨野/奶条	SP0000159			1	16.00	4.08		0	0	0	0	1	1	1	1	f	f
153			89	定制类产品	0	盒	0		120g/憨野	0.00	0.00	0	0	0		1		2026-03-28 17:27:28.82371	2026-03-28 17:27:28.82371	\N	憨野/奶锅巴/	SP0000158			1	27.00	5.28	6900001584957	0	0	0	0	1	1	1	1	f	f
155			37	成品	0	盒	0		1一斤装	0.00	0.00	0	0	0		1		2026-03-28 17:27:29.248233	2026-03-28 17:27:29.248233	\N	羊奶粉/1斤	SP0000157			1	18.00	12.50		0	0	0	0	1	1	1	1	f	f
157			34	广告物料	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:29.675734	2026-03-28 17:27:29.675734	\N	干肉奶茶	SP0000156			1	15.00	5.50	6982118636994	0	0	0	0	1	1	1	1	f	f
159			37	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-28 17:27:30.108714	2026-03-28 17:27:30.108714	\N	阿润月饼/五仁馅	SP0000155			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
161			37	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-28 17:27:30.535246	2026-03-28 17:27:30.535246	\N	阿润月饼/奶皮子馅	SP0000154			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
163			37	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-28 17:27:30.963043	2026-03-28 17:27:30.963043	\N	阿润月饼/黄油渣馅	SP0000153			1	15.00	10.00		0	0	0	0	1	1	1	1	f	f
165			37	成品	0	袋	0		4颗/350克	0.00	0.00	0	0	0		1		2026-03-28 17:27:31.385325	2026-03-28 17:27:31.385325	\N	阿润月饼/奶豆腐馅	SP0000152			1	15.00	10.00	6922814823197	0	0	0	0	1	1	1	1	f	f
167			37	成品	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:31.810013	2026-03-28 17:27:31.810013	\N	实惠/奶豆腐	SP0000151			1	20.00	12.00	6900001519215	0	0	0	0	1	1	1	1	f	f
169			41	散装	0	斤	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:32.233895	2026-03-28 17:27:32.233895	\N	冻炒米/散装	SP0000150			1	25.00	16.00	6900001505720	0	0	0	0	1	1	1	1	f	f
171			37	成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:32.657416	2026-03-28 17:27:32.657416	\N	冻炒米/科尔沁	SP0000149			1	12.00	7.00	6900001499679	0	0	0	0	1	1	1	1	f	f
173			37	成品	0	盒	0		320克	0.00	0.00	0	0	0		1		2026-03-28 17:27:33.074961	2026-03-28 17:27:33.074961	\N	羊乳奶粉/奶茶专用	SP0000148			1	32.00	25.00	6900001481464	0	0	0	0	1	1	1	1	f	f
175			37	成品	0	盒	0		320克	0.00	0.00	0	0	0		1		2026-03-28 17:27:33.495808	2026-03-28 17:27:33.495808	\N	河套奶粉	SP0000147			1	18.00	14.00	6900001473306	0	0	0	0	1	1	1	1	f	f
177			37	成品	0	盒	0		1盒	0.00	0.00	0	0	0		1		2026-03-28 17:27:33.978273	2026-03-28 17:27:33.978273	\N	奶皮卷/科尔沁	SP0000146			1	30.00	15.00	6900001463143	0	0	0	0	1	1	1	1	f	f
179			41	散装	0	斤	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:27:34.408048	2026-03-28 17:27:34.408048	\N	红枣	SP0000145			1	18.00	12.00	6900001459821	0	0	0	0	1	1	1	1	f	f
181			93	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-28 17:27:36.010771	2026-03-28 17:27:36.010771	\N	芝士奶豆腐月饼	SP0000144			1	8.00	5.00	6900001442932	0	0	0	0	1	1	1	1	f	f
183			93	供货品	0	盒	0		250	0.00	0.00	0	0	0		1		2026-03-28 17:27:36.496467	2026-03-28 17:27:36.496467	\N	那牧尔酸奶	SP0000143			1	8.00	4.00	6900001436777	0	0	0	0	1	1	1	1	f	f
185			93	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-28 17:27:37.030085	2026-03-28 17:27:37.030085	\N	奶豆腐月饼	SP0000142			1	8.00	5.00	6900001427497	0	0	0	0	1	1	1	1	f	f
187			93	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-28 17:27:37.46129	2026-03-28 17:27:37.46129	\N	酸奶月饼	SP0000141			1	8.00	5.00	6900001418318	0	0	0	0	1	1	1	1	f	f
189			93	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-28 17:27:37.888338	2026-03-28 17:27:37.888338	\N	黄油渣月饼	SP0000140			1	8.00	5.00	6900001407174	0	0	0	0	1	1	1	1	f	f
191			93	供货品	0	小包	0		80克	0.00	0.00	0	0	0		1		2026-03-28 17:27:38.508488	2026-03-28 17:27:38.508488	\N	奶皮月饼	SP0000139			1	8.00	5.00	6900001399224	0	0	0	0	1	1	1	1	f	f
193			93	供货品	0	袋	0		5	0.00	0.00	0	0	0		1		2026-03-28 17:27:38.934238	2026-03-28 17:27:38.934238	\N	早餐包/那牧尔	SP0000138			1	15.00	10.00	6900001382864	0	0	0	0	1	1	1	1	f	f
195			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:27:39.795895	2026-03-28 17:27:39.795895	\N	透专标签/奶皮千层	SP0000137			1	0.00	0.07	6900001376529	0	0	0	0	1	1	1	1	f	f
197			37	成品	0	瓶	0		1斤装	0.00	0.00	0	0	0		1		2026-03-28 17:27:40.222833	2026-03-28 17:27:40.222833	\N	纯净/黄油/斤	SP0000136			1	35.00	22.00	6900001367517	0	0	0	0	1	1	1	1	f	f
199			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:27:40.647287	2026-03-28 17:27:40.647287	\N	透专标签/脆香奶条/微甜	SP0000135			1	0.00	0.37	6900001356463	0	0	0	0	1	1	1	1	f	f
201			41	散装	0	麻袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:41.072223	2026-03-28 17:27:41.072223	\N	手工白花炒米/散装	SP0000134			1	7.00	5.37	6900001345795	0	0	0	0	1	1	1	1	f	f
203			59	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-28 17:27:41.503505	2026-03-28 17:27:41.503505	\N	乌日莫糖/散装	SP0000133			1	30.00	22.00	6900001338681	0	0	0	0	1	1	1	1	f	f
205			37	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-28 17:27:41.930084	2026-03-28 17:27:41.930084	\N	盛宇燃奶豆腐/甜味	SP0000132			1	26.00	19.00	6900001329621	0	0	0	0	1	1	1	1	f	f
207			37	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-28 17:27:42.357866	2026-03-28 17:27:42.357866	\N	盛宇燃奶豆腐/原味	SP0000131			1	26.00	19.00	6900001315573	0	0	0	0	1	1	1	1	f	f
209			37	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-28 17:27:42.787056	2026-03-28 17:27:42.787056	\N	真空奶豆腐砖/甜味	SP0000130			1	26.00	17.00	6900001305887	0	0	0	0	1	1	1	1	f	f
211			37	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-28 17:27:43.213847	2026-03-28 17:27:43.213847	\N	真空奶豆腐砖/原味	SP0000129			1	26.00	17.00	6900001297957	0	0	0	0	1	1	1	1	f	f
213			37	成品	0	袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:43.651226	2026-03-28 17:27:43.651226	\N	风干牛肉500g大片	SP0000128			1	128.00	95.00	6900001286630	0	0	0	0	1	1	1	1	f	f
215			37	成品	0	袋	0		1斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:44.081533	2026-03-28 17:27:44.081533	\N	哈斯乌拉牛肉干500g原味	SP0000127			1	98.00	83.00	6900001278368	0	0	0	0	1	1	1	1	f	f
217			59	糖果sugar	0	袋	0		450g	0.00	0.00	0	0	0		1		2026-03-28 17:27:44.509884	2026-03-28 17:27:44.509884	\N	蓝旗绿乳糖惠虹糖	SP0000126			1	9.00	7.00	6900001262639	0	0	0	0	1	1	1	1	f	f
219			59	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-28 17:27:44.932542	2026-03-28 17:27:44.932542	\N	蓝旗绿乳糖奶香酥	SP0000125			1	6.00	4.00	6900001257630	0	0	0	0	1	1	1	1	f	f
221			59	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-28 17:27:45.372147	2026-03-28 17:27:45.372147	\N	蓝旗绿乳糖果仁酥	SP0000124			1	6.00	4.00	6900001241338	0	0	0	0	1	1	1	1	f	f
223			59	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-28 17:27:45.797599	2026-03-28 17:27:45.797599	\N	蓝旗绿乳糖水果	SP0000123			1	6.00	4.00	6900001238866	0	0	0	0	1	1	1	1	f	f
225			59	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-28 17:27:46.228642	2026-03-28 17:27:46.228642	\N	蓝旗绿乳糖黄油球	SP0000122			1	6.00	4.00	6900001223574	0	0	0	0	1	1	1	1	f	f
227			59	糖果sugar	0	袋	0		270	0.00	0.00	0	0	0		1		2026-03-28 17:27:46.662502	2026-03-28 17:27:46.662502	\N	蓝旗绿乳糖炼乳	SP0000121			1	6.00	4.00	6900001214103	0	0	0	0	1	1	1	1	f	f
229			37	成品	0	盒	0		250克	0.00	0.00	0	0	0		1		2026-03-28 17:27:47.098052	2026-03-28 17:27:47.098052	\N	黄油渣/盒	SP0000120			1	12.00	8.00	6900001205597	0	0	0	0	1	1	1	1	f	f
231			41	散装	0	盒	0		半斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:47.528637	2026-03-28 17:27:47.528637	\N	脆奶条/散装/科尔沁	SP0000119			1	12.50	7.00	6900001196244	0	0	0	0	1	1	1	1	f	f
233			41	散装	0	斤	0		斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:47.960381	2026-03-28 17:27:47.960381	\N	机器乌日末液体	SP0000118			1	15.00	9.00	6900001182829	0	0	0	0	1	1	1	1	f	f
235			37	成品	0	瓶	0		半斤装	0.00	0.00	0	0	0		1		2026-03-28 17:27:48.386433	2026-03-28 17:27:48.386433	\N	黄油/半斤	SP0000117			1	16.00	11.00	6900001176074	0	0	0	0	1	1	1	1	f	f
237			37	成品	0	瓶	0		400克	0.00	0.00	0	0	0		1		2026-03-28 17:27:48.813281	2026-03-28 17:27:48.813281	\N	黄油/斤	SP0000116			1	26.00	20.00	6900001162463	0	0	0	0	1	1	1	1	f	f
239			41	散装	0	斤	0		斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:49.245385	2026-03-28 17:27:49.245385	\N	手工乌日末液体	SP0000115			1	10.00	8.00	6900001151503	0	0	0	0	1	1	1	1	f	f
241			59	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-28 17:27:49.675607	2026-03-28 17:27:49.675607	\N	嚼口脆炒米糖/散装	SP0000114			1	25.00	15.00	6900001147035	0	0	0	0	1	1	1	1	f	f
243			59	糖果sugar	0	斤	0		1斤散称	0.00	0.00	0	0	0		1		2026-03-28 17:27:50.100379	2026-03-28 17:27:50.100379	\N	酸奶炒米糖/散装	SP0000113			1	20.00	10.00	6900001139227	0	0	0	0	1	1	1	1	f	f
245			41	散装	0	斤	0		10斤装/麻袋	0.00	0.00	0	0	0		1		2026-03-28 17:27:50.522919	2026-03-28 17:27:50.522919	\N	炒米/散装/硬口	SP0000112			1	7.50	4.80	6900001127456	0	0	0	0	1	1	1	1	f	f
247			37	成品	0	袋	0		300克	0.00	0.00	0	0	0		1		2026-03-28 17:27:50.965751	2026-03-28 17:27:50.965751	\N	冻炒米/袋装	SP0000111			1	12.00	8.00	6900001115240	0	0	0	0	1	1	1	1	f	f
249			41	散装	0	个	0		1斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:51.395188	2026-03-28 17:27:51.395188	\N	小/无印花/奶豆腐砖/1斤	SP0000110			1	32.00	20.00	6900001102849	0	0	0	0	1	1	1	1	f	f
251			41	散装	0	个	0		1斤2两	0.00	0.00	0	0	0		1		2026-03-28 17:27:51.826008	2026-03-28 17:27:51.826008	\N	大奶豆腐砖/1.2斤	SP0000109			1	35.00	25.00	6900001096391	0	0	0	0	1	1	1	1	f	f
253			41	散装	0	个	0		1斤	0.00	0.00	0	0	0		1		2026-03-28 17:27:52.25645	2026-03-28 17:27:52.25645	\N	小奶豆腐砖/1斤	SP0000108			1	30.00	20.00	6900001086128	0	0	0	0	1	1	1	1	f	f
255			53	塑料袋	0	袋	0		大/中/小	0.00	0.00	0	0	0		1		2026-03-28 17:27:52.685857	2026-03-28 17:27:52.685857	\N	塑料购物袋	SP0000107			1	0.00	0.00	6900001075048	0	0	0	0	1	1	1	1	f	f
257			37	成品	0	袋	0		400克	0.00	0.00	0	0	0		1		2026-03-28 17:27:53.126465	2026-03-28 17:27:53.126465	\N	白砂糖	SP0000106			1	5.00	3.50	6900001064304	0	0	0	0	1	1	1	1	f	f
259			37	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-28 17:27:53.549684	2026-03-28 17:27:53.549684	\N	加沙奶豆腐	SP0000105			1	16.00	12.00	6973630778288	0	0	0	0	1	1	1	1	f	f
261			37	成品	0	袋	0		500g	0.00	0.00	0	0	0		1		2026-03-28 17:27:53.988393	2026-03-28 17:27:53.988393	\N	炒米粉/aag	SP0000104			1	6.50	4.80	6900001043080	0	0	0	0	1	1	1	1	f	f
263			37	成品	0	袋	0		500克	0.00	0.00	0	0	0		1		2026-03-28 17:27:54.418732	2026-03-28 17:27:54.418732	\N	炒米海丰	SP0000103			1	7.50	5.80	6958856810059	0	0	0	0	1	1	1	1	f	f
265			47	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-28 17:27:54.840197	2026-03-28 17:27:54.840197	\N	透明成品/奶条/原味/线下	SP0000102			1	22.00	0.00	6900001026070	0	0	0	0	1	1	1	1	f	f
267			47	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-28 17:27:55.276392	2026-03-28 17:27:55.276392	\N	透明成品/奶皮千层/线下	SP0000101			1	26.60	0.00	6900001013558	0	0	0	0	1	1	1	1	f	f
273			47	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-28 17:27:56.548855	2026-03-28 17:27:56.548855	\N	透明成品/鲜奶皮/线下	SP0000098			1	29.80	0.00	6900000986032	0	0	0	0	1	1	1	1	f	f
277			97	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-28 17:27:57.834848	2026-03-28 17:27:57.834848	\N	半成品/透明/原味/鲜奶酪	SP0000096			2	29.80	13.00	6900000966050	0	0	0	0	1	1	1	1	f	f
279			97	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-28 17:27:58.265472	2026-03-28 17:27:58.265472	\N	半成品/透明/甜味/鲜奶酪	SP0000095			2	29.80	13.00	6900000955561	0	0	0	0	1	1	1	1	f	f
281			47	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-28 17:27:58.690369	2026-03-28 17:27:58.690369	\N	透明成品/鲜奶酪/原味/线下	SP0000094			1	29.80	0.00	6900000947515	0	0	0	0	1	1	1	1	f	f
283			97	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-28 17:27:59.11234	2026-03-28 17:27:59.11234	\N	半成品/透明/甜味奶条	SP0000093			2	22.00	6.80	6900000935538	0	0	0	0	1	1	1	1	f	f
285			97	给组装好产品	0	盒	0		200克	0.00	0.00	0	0	0		1		2026-03-28 17:27:59.541569	2026-03-28 17:27:59.541569	\N	半成品/透明/原味奶条	SP0000092			2	22.00	7.20	6900000924342	0	0	0	0	1	1	1	1	f	f
287			97	给组装好产品	0	盒	0		150克	0.00	0.00	0	0	0		1		2026-03-28 17:27:59.974182	2026-03-28 17:27:59.974182	\N	半成品/透明/奶皮千层	SP0000091			2	25.60	12.00	6900000917840	0	0	0	0	1	1	1	1	f	f
289			97	给组装好产品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-28 17:28:00.405989	2026-03-28 17:28:00.405989	\N	半成品/透明/奶皮卷	SP0000090			2	26.60	13.00	6900000907890	0	0	0	0	1	1	1	1	f	f
291			97	给组装好产品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-28 17:28:00.864437	2026-03-28 17:28:00.864437	\N	半成品/透明/鲜奶皮	SP0000089			2	26.60	14.00	6900000899530	0	0	0	0	1	1	1	1	f	f
293			34	广告物料	0	张	0		价格/规格/不定	0.00	0.00	0	0	0		1		2026-03-28 17:28:01.300252	2026-03-28 17:28:01.300252	\N	展示用卡牌	SP0000088			1	0.00	0.00	6900000881797	0	0	0	0	1	1	1	1	f	f
295			65	袋子	0	张	0		250克装	0.00	0.00	0	0	0		1		2026-03-28 17:28:01.732833	2026-03-28 17:28:01.732833	\N	专袋/乌日莫	SP0000087			1	0.00	0.46	6900000874528	0	0	0	0	1	1	1	1	f	f
269			47	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-28 17:27:55.699284	2026-03-28 17:27:55.699284	\N	透明成品/奶皮卷/线下	SP0000100			1	26.60	0.00	6900001005826	0	0	0	0	1	1	1	1	f	f
271			47	成品	0	盒	0		180克	0.00	0.00	0	0	0		1		2026-03-28 17:27:56.12547	2026-03-28 17:27:56.12547	\N	透明成品/奶条/甜味/线下	SP0000099			1	22.00	0.00	6900000999855	0	0	0	0	1	1	1	1	f	f
275			47	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-28 17:27:56.972388	2026-03-28 17:27:56.972388	\N	透明成品/鲜奶酪/甜味/线下	SP0000097			1	29.80	0.00	6977375240277	0	0	0	0	1	1	1	1	f	f
297			65	袋子	0	张	0		500克装	0.00	0.00	0	0	0		1		2026-03-28 17:28:02.272019	2026-03-28 17:28:02.272019	\N	专袋/乌日莫/炒米	SP0000086			1	0.00	0.79	6900000861218	0	0	0	0	1	1	1	1	f	f
299			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:28:02.701989	2026-03-28 17:28:02.701989	\N	透专标签/奶皮卷	SP0000085			1	0.00	0.37	6900000856863	0	0	0	0	1	1	1	1	f	f
301			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:28:03.126553	2026-03-28 17:28:03.126553	\N	透专标签/冻炒米	SP0000084			1	0.00	0.37	6900000847671	0	0	0	0	1	1	1	1	f	f
303			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:28:03.552801	2026-03-28 17:28:03.552801	\N	透专标签/奶酪/原味	SP0000083			1	0.00	0.37	6900000831130	0	0	0	0	1	1	1	1	f	f
305			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:28:03.98941	2026-03-28 17:28:03.98941	\N	透专标签/奶酪/甜味	SP0000082			1	0.00	0.37	6900000828304	0	0	0	0	1	1	1	1	f	f
307			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:28:04.418302	2026-03-28 17:28:04.418302	\N	透专标签/乳清奶条/甜味	SP0000081			1	0.00	0.05	6900000815004	0	0	0	0	1	1	1	1	f	f
309			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:28:04.84381	2026-03-28 17:28:04.84381	\N	透专标签/乳清奶条/原味	SP0000080			1	0.00	0.05	6900000807613	0	0	0	0	1	1	1	1	f	f
311			95	标签纸	0	张	0		1张	0.00	0.00	0	0	0		1		2026-03-28 17:28:05.265847	2026-03-28 17:28:05.265847	\N	透专标签/鲜奶皮	SP0000079			1	0.00	0.37	6900000794933	0	0	0	0	1	1	1	1	f	f
313			99	亚克力	0	盒	0		待包换/冻炒米 145X85X55	0.00	0.00	0	0	0		1		2026-03-28 17:28:06.131319	2026-03-28 17:28:06.131319	\N	大/长方/亚克力/待用	SP0000078			1	0.00	1.30	6900000782027	0	0	0	0	1	1	1	1	f	f
315			99	亚克力	0	盒	0		乳清奶条盒	0.00	0.00	0	0	0		1		2026-03-28 17:28:06.562172	2026-03-28 17:28:06.562172	\N	小/长方/亚克力/乳清奶条盒	SP0000077			1	0.00	1.20	6900000778282	0	0	0	0	1	1	1	1	f	f
317			99	亚克力	0	盒	0		235X170X35	0.00	0.00	0	0	0		1		2026-03-28 17:28:07.008646	2026-03-28 17:28:07.008646	\N	大/牛薄脆盒/亚克力	SP0000076			1	0.00	2.60	6900000761425	0	0	0	0	1	1	1	1	f	f
319			99	亚克力	0	盒	0		31g	0.00	0.00	0	0	0		1		2026-03-28 17:28:07.443467	2026-03-28 17:28:07.443467	\N	三角/奶皮千层盒	SP0000075			1	0.00	0.85	6900000754498	0	0	0	0	1	1	1	1	f	f
321			99	亚克力	0	盒	0		182X120X28/烤奶豆腐片/奶皮卷	0.00	0.00	0	0	0		1		2026-03-28 17:28:07.862887	2026-03-28 17:28:07.862887	\N	扁盒/亚克力/带内托	SP0000074			1	0.00	1.75	6900000747152	0	0	0	0	1	1	1	1	f	f
323			99	亚克力	0	盒	0		85X85X63  鲜奶皮	0.00	0.00	0	0	0		1		2026-03-28 17:28:08.281506	2026-03-28 17:28:08.281506	\N	中/方形/亚克力盒/	SP0000072			1	2.50	0.85	6900000724486	0	0	0	0	1	1	1	1	f	f
325			99	亚克力	0	盒	0		7.4X7.4X7.8 奶豆腐/冻炒米通用	0.00	0.00	0	0	0		1		2026-03-28 17:28:08.705372	2026-03-28 17:28:08.705372	\N	小/方形/亚克力盒/	SP0000071			1	2.00	0.80	6900000719676	0	0	0	0	1	1	1	1	f	f
327			47	成品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-28 17:28:09.134809	2026-03-28 17:28:09.134809	\N	透明成品/冻炒米/线下	SP0000070			1	23.50	0.00	6900000709295	0	0	0	0	1	1	1	1	f	f
329			97	给组装好产品	0	盒	0		140克	0.00	0.00	0	0	0		1		2026-03-28 17:28:09.563155	2026-03-28 17:28:09.563155	\N	半成品/透明/冻炒米	SP0000069			2	23.50	4.20	6900000699220	0	0	0	0	1	1	1	1	f	f
331			101	散小包装	0	小包	0		50克	0.00	0.00	0	0	0		1		2026-03-28 17:28:10.432948	2026-03-28 17:28:10.432948	\N	查嘎粉/小包装袋	SP0000068			1	5.00	3.00	6900000686492	0	0	0	0	1	1	1	1	f	f
333			35	散货	0	桶	0		4斤装	0.00	0.00	0	0	0	4斤装/1元一斤	1		2026-03-28 17:28:10.861488	2026-03-28 17:28:10.861488	\N	查嘎/乳清	SP0000067			1	10.00	4.00	6900000679211	0	0	0	0	1	1	1	1	f	f
335			41	散装	0	张	0		150-180克	0.00	0.00	0	0	0		1		2026-03-28 17:28:11.293355	2026-03-28 17:28:11.293355	\N	大/奶皮	SP0000066			1	20.00	13.00	6900000661992	0	0	0	0	1	1	1	1	f	f
337			41	散装	0	张	0		120-150克	0.00	0.00	0	0	0		1		2026-03-28 17:28:11.731141	2026-03-28 17:28:11.731141	\N	小/奶皮	SP0000065			1	15.00	10.00	6900000651693	0	0	0	0	1	1	1	1	f	f
339			37	成品	0	盒	0		200克	0.00	0.00	0	0	0	供货价13	1		2026-03-28 17:28:12.172305	2026-03-28 17:28:12.172305	\N	热奶豆腐碗	SP0000064			1	15.00	10.00	6900000642521	0	0	0	0	1	1	1	1	f	f
341			41	散装	0	斤	0		45散称/斤/9元/100克	0.00	0.00	0	0	0		1		2026-03-28 17:28:12.604299	2026-03-28 17:28:12.604299	\N	甜味/散称/奶豆腐块儿	SP0000063			1	70.00	45.00	6900000639276	0	0	0	0	1	1	1	1	f	f
343			41	散装	0	斤	0		45散称/斤/9元/100克	0.00	0.00	0	0	0		1		2026-03-28 17:28:13.038969	2026-03-28 17:28:13.038969	\N	原味/散称/奶豆腐块儿	SP0000062			1	70.00	45.00	6900000623124	0	0	0	0	1	1	1	1	f	f
345			75	半成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-28 17:28:13.471724	2026-03-28 17:28:13.471724	\N	精品/奶豆腐块儿/甜味/	SP0000061			1	20.00	14.50	6900000617311	0	0	0	0	1	1	1	1	f	f
347			103	组装好品	0	瓶	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:14.337168	2026-03-28 17:28:14.337168	\N	纯净黄油/瓶装好的	SP0000060			1	0.00	6.00	6900000604359	0	0	0	0	1	1	1	1	f	f
349			71	黄油	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:14.763123	2026-03-28 17:28:14.763123	\N	黄油脖签	SP0000059			1	0.00	0.08	6900000598069	0	0	0	0	1	1	1	1	f	f
351			83	成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:15.197142	2026-03-28 17:28:15.197142	\N	暂用/茶 新旧更替	SP0000058			1	58.00	0.00	6900000589769	0	0	0	0	1	1	1	1	f	f
353			105	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:16.057749	2026-03-28 17:28:16.057749	\N	新茶包人工费	SP0000057			1	0.00	1.00	6900000571565	0	0	0	0	1	1	1	1	f	f
355			107	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:16.911624	2026-03-28 17:28:16.911624	\N	新茶专用标签纸	SP0000056			1	0.00	0.05	6900000561600	0	0	0	0	1	1	1	1	f	f
357			107	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:17.333463	2026-03-28 17:28:17.333463	\N	新茶包/纸	SP0000055			1	0.00	0.27	6900000553413	0	0	0	0	1	1	1	1	f	f
359			83	成品	0	盒	0		16次泡	0.00	0.00	0	0	0		1		2026-03-28 17:28:17.754938	2026-03-28 17:28:17.754938	\N	新/青砖奶茶	SP0000054			1	58.00	0.00	6977252570039	0	0	0	0	1	1	1	1	f	f
361			41	散装	0	盒	0		斤/两盒	0.00	0.00	0	0	0		1		2026-03-28 17:28:18.178404	2026-03-28 17:28:18.178404	\N	烤奶皮	SP0000053			1	30.00	22.00	6900000535282	0	0	0	0	1	1	1	1	f	f
363			53	塑料袋	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:18.614024	2026-03-28 17:28:18.614024	\N	塑料手提袋	SP0000052			1	0.00	0.19	6900000526367	0	0	0	0	1	1	1	1	f	f
365			111	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:19.921176	2026-03-28 17:28:19.921176	\N	甜味/标签/不干胶/传统奶豆腐	SP0000051			1	0.00	0.06	6900000517653	0	0	0	0	1	1	1	1	f	f
367			107	青砖奶茶	0	张	0		一张	0.00	0.00	0	0	0		1		2026-03-28 17:28:20.350921	2026-03-28 17:28:20.350921	\N	茶包/类腰封纸	SP0000050			1	0.00	0.18	6900000504012	0	0	0	0	1	1	1	1	f	f
369			83	成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-28 17:28:20.78018	2026-03-28 17:28:20.78018	\N	甜味传统奶豆腐/袋装成品	SP0000049			1	34.00	12.78	6900000499096	0	0	0	0	1	1	1	1	f	f
371			75	半成品	0	袋	0		150克	0.00	0.00	0	0	0		1		2026-03-28 17:28:21.202427	2026-03-28 17:28:21.202427	\N	精品/奶豆腐块儿/原味	SP0000048			1	20.00	14.50	6900000481263	0	0	0	0	1	1	1	1	f	f
373			113	样品采购	0	斤	0		不定具体产品	0.00	0.00	0	0	0		1		2026-03-28 17:28:22.064579	2026-03-28 17:28:22.064579	\N	采购样品专用/乳制品	SP0000047			1	0.00	0.00	6900000479748	0	0	0	0	1	1	1	1	f	f
375			83	成品	0	袋	0		150	0.00	0.00	0	0	0		1		2026-03-28 17:28:22.498756	2026-03-28 17:28:22.498756	\N	原味传统奶豆腐/成品袋装	SP0000046			1	34.00	12.78	6900000461987	0	0	0	0	1	1	1	1	f	f
377			83	成品	0	瓶	0		100克	0.00	0.00	0	0	0		1		2026-03-28 17:28:22.923992	2026-03-28 17:28:22.923992	\N	蒙古黄油/瓶装成品	SP0000045			1	39.00	8.05	6900000452315	0	0	0	0	1	1	1	1	f	f
379			117	奶果子	0	袋	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:24.228706	2026-03-28 17:28:24.228706	\N	奶果子/专用塑膜袋	SP0000044			1	0.00	0.10	6900000443474	0	0	0	0	1	1	1	1	f	f
381			75	半成品	0	块儿	0		平均一块儿	0.00	0.00	0	0	0		1		2026-03-28 17:28:24.660962	2026-03-28 17:28:24.660962	\N	奶果子/散装	SP0000043			1	2.50	0.80	6900000434411	0	0	0	0	1	1	1	1	f	f
383			83	成品	0	盒	0		240克	0.00	0.00	0	0	0		1		2026-03-28 17:28:25.089468	2026-03-28 17:28:25.089468	\N	奶果子/盒装/成品	SP0000042			1	58.00	13.21	6900000427543	0	0	0	0	1	1	1	1	f	f
385			121	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:26.384781	2026-03-28 17:28:26.384781	\N	冻炒米专用/塑膜袋	SP0000041			1	0.00	0.10	6900000413063	0	0	0	0	1	1	1	1	f	f
387			83	成品	0	盒	0		110克	0.00	0.00	0	0	0		1		2026-03-28 17:28:26.810348	2026-03-28 17:28:26.810348	\N	冻炒米成品盒	SP0000040			1	36.00	6.00	6900000408112	0	0	0	0	1	1	1	1	f	f
389			107	青砖奶茶	0	袋	0		0	0.00	0.00	0	0	0		1		2026-03-28 17:28:27.235807	2026-03-28 17:28:27.235807	\N	茶专用/热缩膜	SP0000039			1	0.00	0.10	6900000393419	0	0	0	0	1	1	1	1	f	f
391			83	成品	0	盒	0		16次泡	0.00	0.00	0	0	0		1		2026-03-28 17:28:27.660797	2026-03-28 17:28:27.660797	\N	青砖奶茶成品	SP0000038			1	58.00	15.00	6900000389670	0	0	0	0	1	1	1	1	f	f
393			75	半成品	0	小包	0		2g	0.00	0.00	0	0	0		1		2026-03-28 17:28:28.095437	2026-03-28 17:28:28.095437	\N	茶专用/盐包	SP0000037			1	0.00	0.07	6900000375562	0	0	0	0	1	1	1	1	f	f
395			107	青砖奶茶	0	张	0		0	0.00	0.00	0	0	0		1		2026-03-28 17:28:28.532285	2026-03-28 17:28:28.532285	\N	茶专用/硫酸纸	SP0000036			1	0.00	0.32	6900000362581	0	0	0	0	1	1	1	1	f	f
397			107	青砖奶茶	0	张	0		0	0.00	0.00	0	0	0		1		2026-03-28 17:28:28.968301	2026-03-28 17:28:28.968301	\N	茶专用/不干胶/标签	SP0000035			1	0.00	0.04	6900000358921	0	0	0	0	1	1	1	1	f	f
399			107	青砖奶茶	0	个	0		袋100个/平均价0.1599	0.00	0.00	0	0	0		1		2026-03-28 17:28:29.399565	2026-03-28 17:28:29.399565	\N	木勺	SP0000034			1	0.00	0.16	6900000349016	0	0	0	0	1	1	1	1	f	f
401			125	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:30.724401	2026-03-28 17:28:30.724401	\N	冷冻柜/冰箱	SP0000033			1	0.00	1609.48	6900000335117	0	0	0	0	1	1	1	1	f	f
403			125	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:31.157328	2026-03-28 17:28:31.157328	\N	封口机/真空	SP0000032			1	0.00	3800.00	6900000324528	0	0	0	0	1	1	1	1	f	f
405			125	设备	0	台	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:31.588777	2026-03-28 17:28:31.588777	\N	热收缩膜机	SP0000031			1	0.00	1838.00	6900000316828	0	0	0	0	1	1	1	1	f	f
407			105	其他成本	0	件	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:32.007227	2026-03-28 17:28:32.007227	\N	圆通速递快递费	SP0000030			1	0.00	4.00	6900000308856	0	0	0	0	1	1	1	1	f	f
409			105	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:32.443599	2026-03-28 17:28:32.443599	\N	泰成物流费	SP0000029			1	0.00	0.00	6900000291007	0	0	0	0	1	1	1	1	f	f
411			105	其他成本	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:32.868705	2026-03-28 17:28:32.868705	\N	顺丰快递费	SP0000028			1	0.00	0.00	6900000286232	0	0	0	0	1	1	1	1	f	f
413			83	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-28 17:28:33.291815	2026-03-28 17:28:33.291815	\N	原味奶条成品	SP0000027			1	52.00	11.61	6900000277492	0	0	0	0	1	1	1	1	f	f
415			83	成品	0	袋	0		250克	0.00	0.00	0	0	0		1		2026-03-28 17:28:33.713709	2026-03-28 17:28:33.713709	\N	甜味奶条成品	SP0000026			1	52.00	10.61	6900000265125	0	0	0	0	1	1	1	1	f	f
417			107	青砖奶茶	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:34.134939	2026-03-28 17:28:34.134939	\N	专盒/青砖奶茶外盒	SP0000025			1	0.00	2.50	6900000256884	0	0	0	0	1	1	1	1	f	f
419			75	半成品	0	个	0		400/箱/0.423/球	0.00	0.00	0	0	0		1		2026-03-28 17:28:34.563131	2026-03-28 17:28:34.563131	\N	奶油球	SP0000024			1	0.00	0.45	6900000243728	0	0	0	0	1	1	1	1	f	f
421			75	半成品	0	小包	0		1件2000包/300元/1件	0.00	0.00	0	0	0	已加运费平均采购价	1		2026-03-28 17:28:34.993372	2026-03-28 17:28:34.993372	\N	茶包	SP0000023			1	0.00	0.18	6900000233034	0	0	0	0	1	1	1	1	f	f
423			105	其他成本	0	个	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:35.427636	2026-03-28 17:28:35.427636	\N	北方人工费	SP0000022			1	0.00	1.30	6900000221261	0	0	0	0	1	1	1	1	f	f
425			75	半成品	0	盒	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:35.849803	2026-03-28 17:28:35.849803	\N	冻炒米/给组装半成品/那牧尔	SP0000021			2	0.00	5.50	6900000218137	0	0	0	0	1	1	1	1	f	f
427			75	半成品	0	袋	0		250克/一袋	0.00	0.00	0	0	0		1		2026-03-28 17:28:36.275877	2026-03-28 17:28:36.275877	\N	散装/甜味奶条	SP0000020			1	15.00	8.50	6962547070553	0	0	0	0	1	1	1	1	f	f
429			75	半成品	0	袋	0		250克/一袋	0.00	0.00	0	0	0		1		2026-03-28 17:28:36.818533	2026-03-28 17:28:36.818533	\N	散装/原味奶条	SP0000019			1	0.00	9.00	6915451232840	0	0	0	0	1	1	1	1	f	f
431			71	黄油	0	瓶	0		100ML	0.00	0.00	0	0	0		1		2026-03-28 17:28:37.25053	2026-03-28 17:28:37.25053	\N	专瓶/黄油	SP0000018			1	0.00	1.80	6900000186971	0	0	0	0	1	1	1	1	f	f
433			53	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:37.675829	2026-03-28 17:28:37.675829	\N	手提袋	SP0000017			1	0.00	0.94	6900000178722	0	0	0	0	1	1	1	1	f	f
435			53	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:38.099536	2026-03-28 17:28:38.099536	\N	礼盒/蓝界	SP0000016			1	8.00	4.55	6900000169010	0	0	0	0	1	1	1	1	f	f
437			121	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:38.526635	2026-03-28 17:28:38.526635	\N	标签/不干胶/冻炒米	SP0000015			1	0.00	0.07	6900000151480	0	0	0	0	1	1	1	1	f	f
439			117	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:38.954007	2026-03-28 17:28:38.954007	\N	标签/不干胶/奶果子	SP0000014			1	0.00	0.03	6900000148085	0	0	0	0	1	1	1	1	f	f
441			111	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:39.372123	2026-03-28 17:28:39.372123	\N	原味/标签/不干胶/传统奶豆腐	SP0000013			1	0.00	0.06	6900000132020	0	0	0	0	1	1	1	1	f	f
443			111	传统奶豆腐	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:39.801499	2026-03-28 17:28:39.801499	\N	专袋/传统奶豆腐	SP0000012			1	0.00	0.55	6900000127767	0	0	0	0	1	1	1	1	f	f
445			127	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:40.687424	2026-03-28 17:28:40.687424	\N	标签/不干胶/奶条/原味	SP0000011			1	0.00	0.05	6900000115061	0	0	0	0	1	1	1	1	f	f
447			127	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:41.126452	2026-03-28 17:28:41.126452	\N	标签/不干胶/奶条/甜味	SP0000010			1	0.00	0.05	6900000108033	0	0	0	0	1	1	1	1	f	f
449			117	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:41.559205	2026-03-28 17:28:41.559205	\N	定制款/专内袋/扎那家奶果子	SP0000009			1	0.00	0.07	6900000097364	0	0	0	0	1	1	1	1	f	f
451			117	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:41.985262	2026-03-28 17:28:41.985262	\N	专内袋/奶果子	SP0000008			1	0.00	0.08	6900000085792	0	0	0	0	1	1	1	1	f	f
453			53	塑料袋	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:42.415856	2026-03-28 17:28:42.415856	\N	真空袋	SP0000007			1	0.00	0.17	6900000079283	0	0	0	0	1	1	1	1	f	f
455			71	黄油	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:42.850216	2026-03-28 17:28:42.850216	\N	专标签/黄油	SP0000006			1	0.00	0.06	6900000068809	0	0	0	0	1	1	1	1	f	f
457			117	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:43.276575	2026-03-28 17:28:43.276575	\N	专内盒/奶果子	SP0000005			1	0.00	0.65	6900000053298	0	0	0	0	1	1	1	1	f	f
459			117	奶果子	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:43.703506	2026-03-28 17:28:43.703506	\N	专外盒/奶果子	SP0000004			1	0.00	0.65	6900000045203	0	0	0	0	1	1	1	1	f	f
461			127	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:44.130241	2026-03-28 17:28:44.130241	\N	专底盒/奶条	SP0000003			1	0.00	0.37	6900000032892	0	0	0	0	1	1	1	1	f	f
463			121	冻炒米	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:44.557228	2026-03-28 17:28:44.557228	\N	专盒/冻炒米	SP0000002			1	0.00	0.87	6900000028430	0	0	0	0	1	1	1	1	f	f
465			127	奶条	0	张	0		1	0.00	0.00	0	0	0		1		2026-03-28 17:28:44.984159	2026-03-28 17:28:44.984159	\N	专袋/奶条	SP0000001			1	0.00	0.71	6900000015365	0	0	0	0	1	1	1	1	f	f
\.


--
-- Data for Name: goods_brand; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_brand (id, name, status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_cate; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_cate (id, name, parent_id, sort, status, create_time) FROM stdin;
34	广告物料	0	0	1	2026-03-28 17:26:43.354502
35	散货	0	0	1	2026-03-28 17:26:45.823273
36	散货	35	0	1	2026-03-28 17:26:46.253985
37	成品	36	0	1	2026-03-28 17:26:46.675933
39	酒	37	0	1	2026-03-28 17:26:51.803189
41	散装	35	0	1	2026-03-28 17:26:54.796714
43	品牌	35	0	1	2026-03-28 17:26:56.505137
45	透明	43	0	1	2026-03-28 17:26:56.928389
46	透明	44	0	1	2026-03-28 17:26:57.193994
47	成品	45	0	1	2026-03-28 17:26:57.350567
48	成品	46	0	1	2026-03-28 17:26:57.615122
49	通用礼盒	0	0	1	2026-03-28 17:27:01.652463
51	手提袋	49	0	1	2026-03-28 17:27:02.080902
52	手提袋	50	0	1	2026-03-28 17:27:02.339365
53	塑料袋	51	0	1	2026-03-28 17:27:02.528297
54	塑料袋	52	0	1	2026-03-28 17:27:02.761788
55	茶类	37	0	1	2026-03-28 17:27:03.813476
57	成品	55	0	1	2026-03-28 17:27:04.262401
58	成品	56	0	1	2026-03-28 17:27:04.471634
59	糖果sugar	37	0	1	2026-03-28 17:27:09.007976
61	专包	35	0	1	2026-03-28 17:27:10.312856
63	材	61	0	1	2026-03-28 17:27:10.749878
64	材	62	0	1	2026-03-28 17:27:10.900371
65	袋子	63	0	1	2026-03-28 17:27:11.182074
66	袋子	64	0	1	2026-03-28 17:27:11.327707
67	包材	0	0	1	2026-03-28 17:27:16.851675
69	专包材	67	0	1	2026-03-28 17:27:17.399662
70	专包材	68	0	1	2026-03-28 17:27:17.599875
71	黄油	69	0	1	2026-03-28 17:27:17.920257
72	黄油	70	0	1	2026-03-28 17:27:18.096228
73	牧区纯坊X游牧奇遇	0	0	1	2026-03-28 17:27:22.811856
75	半成品	73	0	1	2026-03-28 17:27:23.237118
76	半成品	74	0	1	2026-03-28 17:27:23.325644
77	高端品包材	73	0	1	2026-03-28 17:27:24.091863
79	专包	77	0	1	2026-03-28 17:27:24.516997
80	专包	78	0	1	2026-03-28 17:27:24.608822
81	牛肉干	79	0	1	2026-03-28 17:27:24.956469
82	牛肉干	80	0	1	2026-03-28 17:27:25.03266
83	成品	73	0	1	2026-03-28 17:27:25.814512
85	客户	47	0	1	2026-03-28 17:27:26.679539
87	专属	85	0	1	2026-03-28 17:27:27.10375
88	专属	86	0	1	2026-03-28 17:27:27.163007
89	定制类产品	87	0	1	2026-03-28 17:27:27.535083
90	定制类产品	88	0	1	2026-03-28 17:27:27.592253
91	那牧尔	37	0	1	2026-03-28 17:27:34.902821
93	供货品	91	0	1	2026-03-28 17:27:35.439377
94	供货品	92	0	1	2026-03-28 17:27:35.615915
95	标签纸	63	0	1	2026-03-28 17:27:39.362417
97	给组装好产品	35	0	1	2026-03-28 17:27:57.398188
99	亚克力	63	0	1	2026-03-28 17:28:05.703374
101	散小包装	35	0	1	2026-03-28 17:28:10.002765
103	组装好品	73	0	1	2026-03-28 17:28:13.90841
105	其他成本	0	0	1	2026-03-28 17:28:15.626872
107	青砖奶茶	69	0	1	2026-03-28 17:28:16.484864
109	专袋	67	0	1	2026-03-28 17:28:19.055997
111	传统奶豆腐	109	0	1	2026-03-28 17:28:19.480122
112	传统奶豆腐	110	0	1	2026-03-28 17:28:19.569561
113	样品采购	0	0	1	2026-03-28 17:28:21.632221
115	专盒	67	0	1	2026-03-28 17:28:23.367313
117	奶果子	115	0	1	2026-03-28 17:28:23.797794
118	奶果子	116	0	1	2026-03-28 17:28:23.950545
119	包材	67	0	1	2026-03-28 17:28:25.511794
121	冻炒米	119	0	1	2026-03-28 17:28:25.951575
122	冻炒米	120	0	1	2026-03-28 17:28:26.116639
123	机器	0	0	1	2026-03-28 17:28:29.836394
125	设备	123	0	1	2026-03-28 17:28:30.277305
126	设备	124	0	1	2026-03-28 17:28:30.435833
127	奶条	119	0	1	2026-03-28 17:28:40.242838
\.


--
-- Data for Name: goods_spec; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_spec (id, name, "values", status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_unit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_unit (id, name, status, create_time) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.jobs (id, name, dept_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: operation_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.operation_logs (id, admin_id, admin_name, action, ip, created_at) FROM stdin;
\.


--
-- Data for Name: pay_receipt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pay_receipt (id, receipt_no, order_sn, contact_type, contact_name, amount, pay_date, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: prepay_record; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.prepay_record (id, order_sn, pay_type, supplier_id, supplier_name, customer_id, customer_name, amount, pay_date, fund_id, fund_name, admin_name, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: procure_inhouse; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_inhouse (id, order_no, purchase_order_id, supplier_id, supplier_name, admin_name, in_date, goods_info, remark, status, warehouse_id, warehouse_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: procure_plan; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_plan (id, order_no, plan_date, goods_info, remark, status, admin_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: procure_return; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_return (id, order_no, order_sn, order_id, supplier_id, supplier_name, admin_name, return_date, total_amount, goods_info, remark, status, warehouse_id, warehouse_name, fund_id, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: purchase_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_order (id, order_no, order_sn, supplier_id, supplier_name, admin_name, order_date, total_amount, pay_amount, freight_amount, goods_info, remark, status, warehouse_id, warehouse_name, fund_id, fund_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: retail_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_members (id, name, mobile, gender, birthday, balance, points, level, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: retail_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_orders (id, order_sn, member_id, member_name, goods_info, total_amount, pay_amount, pay_type, order_date, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: retail_recharge; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_recharge (id, recharge_no, member_id, member_name, amount, fund_id, fund_name, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, permissions, status, created_at) FROM stdin;
\.


--
-- Data for Name: sale_contracts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_contracts (id, order_no, order_sn, customer_id, customer_name, admin_name, order_date, total_amount, pay_amount, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_customers (id, name, nickname, code, mobile, tel, email, address, contact, level_name, source_name, level_id, source_id, follow_admin_id, follow_admin, balance, is_sea, remark, status, create_time, update_time, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_offers (id, order_no, customer_id, customer_name, admin_name, offer_date, total_amount, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_out_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_out_order (id, order_no, order_sn, customer_id, customer_name, admin_name, out_date, total_amount, goods_info, remark, status, warehouse_id, warehouse_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_return_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_return_order (id, order_no, customer_id, customer_name, return_date, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.staff (id, name, code, mobile, email, dept_id, dept_name, job_id, job_name, entry_date, gender, status, remark, created_at) FROM stdin;
\.


--
-- Data for Name: stock_checks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_checks (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, admin_name, created_at) FROM stdin;
\.


--
-- Data for Name: stock_flow; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_flow (id, goods_id, goods_name, warehouse_id, warehouse_name, type, qty, before_qty, after_qty, order_no, remark, created_at) FROM stdin;
\.


--
-- Data for Name: stock_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_inventory (id, goods_id, goods_name, goods_code, unit_name, warehouse_id, warehouse_name, qty, cost, update_time) FROM stdin;
\.


--
-- Data for Name: stock_other_in; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_other_in (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: stock_other_out; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_other_out (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: supplier; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.supplier (id, name, contact, mobile, email, address, bank, bank_account, remark, status, create_time, update_time, deleted_at) FROM stdin;
\.


--
-- Data for Name: sys_params; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sys_params (id, key, value, remark) FROM stdin;
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.warehouses (id, name, address, remark, status, create_time) FROM stdin;
1	默认仓库			1	2026-03-28 12:40:01.297668
2	默认仓库			1	2026-03-28 13:04:00.311975
3	默认仓库			1	2026-03-28 15:27:33.970328
4	默认仓库			1	2026-03-28 15:55:43.449274
5	默认仓库			1	2026-03-28 16:38:38.690211
6	默认仓库			1	2026-03-28 16:44:50.600007
7	默认仓库			1	2026-03-28 17:11:35.050357
8	默认仓库			1	2026-03-28 17:22:12.560913
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.admins_id_seq', 8, true);


--
-- Name: collect_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.collect_receipt_id_seq', 1, false);


--
-- Name: company_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.company_info_id_seq', 1, true);


--
-- Name: depts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.depts_id_seq', 1, false);


--
-- Name: finance_costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_costs_id_seq', 1, false);


--
-- Name: finance_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_expenses_id_seq', 1, false);


--
-- Name: finance_funds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_funds_id_seq', 1, false);


--
-- Name: finance_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_invoices_id_seq', 1, false);


--
-- Name: finance_payable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_payable_id_seq', 1, false);


--
-- Name: finance_receivable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_receivable_id_seq', 1, false);


--
-- Name: finance_statements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_statements_id_seq', 1, false);


--
-- Name: goods_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_brand_id_seq', 1, false);


--
-- Name: goods_cate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_cate_id_seq', 128, true);


--
-- Name: goods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_id_seq', 466, true);


--
-- Name: goods_spec_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_spec_id_seq', 1, false);


--
-- Name: goods_unit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_unit_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: operation_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.operation_logs_id_seq', 1, false);


--
-- Name: pay_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pay_receipt_id_seq', 1, false);


--
-- Name: prepay_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.prepay_record_id_seq', 1, false);


--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_inhouse_id_seq', 1, false);


--
-- Name: procure_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_plan_id_seq', 1, false);


--
-- Name: procure_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_return_id_seq', 1, false);


--
-- Name: purchase_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_order_id_seq', 1, false);


--
-- Name: retail_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_members_id_seq', 1, false);


--
-- Name: retail_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_orders_id_seq', 1, false);


--
-- Name: retail_recharge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_recharge_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: sale_contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_contracts_id_seq', 1, false);


--
-- Name: sale_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_customers_id_seq', 1, false);


--
-- Name: sale_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_offers_id_seq', 1, false);


--
-- Name: sale_out_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_out_order_id_seq', 1, false);


--
-- Name: sale_return_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_return_order_id_seq', 1, false);


--
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.staff_id_seq', 1, false);


--
-- Name: stock_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_checks_id_seq', 1, false);


--
-- Name: stock_flow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_flow_id_seq', 1, false);


--
-- Name: stock_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_inventory_id_seq', 1, false);


--
-- Name: stock_other_in_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_other_in_id_seq', 1, false);


--
-- Name: stock_other_out_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_other_out_id_seq', 1, false);


--
-- Name: supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.supplier_id_seq', 1, false);


--
-- Name: sys_params_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sys_params_id_seq', 1, false);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 8, true);


--
-- Name: admins admins_account_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_account_key UNIQUE (account);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: collect_receipt collect_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collect_receipt
    ADD CONSTRAINT collect_receipt_pkey PRIMARY KEY (id);


--
-- Name: company_info company_info_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_info
    ADD CONSTRAINT company_info_pkey PRIMARY KEY (id);


--
-- Name: depts depts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.depts
    ADD CONSTRAINT depts_pkey PRIMARY KEY (id);


--
-- Name: finance_costs finance_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_costs
    ADD CONSTRAINT finance_costs_pkey PRIMARY KEY (id);


--
-- Name: finance_expenses finance_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_expenses
    ADD CONSTRAINT finance_expenses_pkey PRIMARY KEY (id);


--
-- Name: finance_funds finance_funds_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_funds
    ADD CONSTRAINT finance_funds_pkey PRIMARY KEY (id);


--
-- Name: finance_invoices finance_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_invoices
    ADD CONSTRAINT finance_invoices_pkey PRIMARY KEY (id);


--
-- Name: finance_payable finance_payable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_payable
    ADD CONSTRAINT finance_payable_pkey PRIMARY KEY (id);


--
-- Name: finance_receivable finance_receivable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_receivable
    ADD CONSTRAINT finance_receivable_pkey PRIMARY KEY (id);


--
-- Name: finance_statements finance_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_statements
    ADD CONSTRAINT finance_statements_pkey PRIMARY KEY (id);


--
-- Name: goods_brand goods_brand_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_brand
    ADD CONSTRAINT goods_brand_pkey PRIMARY KEY (id);


--
-- Name: goods_cate goods_cate_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_cate
    ADD CONSTRAINT goods_cate_pkey PRIMARY KEY (id);


--
-- Name: goods goods_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods
    ADD CONSTRAINT goods_pkey PRIMARY KEY (id);


--
-- Name: goods_spec goods_spec_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_spec
    ADD CONSTRAINT goods_spec_pkey PRIMARY KEY (id);


--
-- Name: goods_unit goods_unit_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit
    ADD CONSTRAINT goods_unit_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: operation_logs operation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operation_logs
    ADD CONSTRAINT operation_logs_pkey PRIMARY KEY (id);


--
-- Name: pay_receipt pay_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pay_receipt
    ADD CONSTRAINT pay_receipt_pkey PRIMARY KEY (id);


--
-- Name: prepay_record prepay_record_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prepay_record
    ADD CONSTRAINT prepay_record_pkey PRIMARY KEY (id);


--
-- Name: procure_inhouse procure_inhouse_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_inhouse
    ADD CONSTRAINT procure_inhouse_pkey PRIMARY KEY (id);


--
-- Name: procure_plan procure_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_plan
    ADD CONSTRAINT procure_plan_pkey PRIMARY KEY (id);


--
-- Name: procure_return procure_return_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_return
    ADD CONSTRAINT procure_return_pkey PRIMARY KEY (id);


--
-- Name: purchase_order purchase_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_pkey PRIMARY KEY (id);


--
-- Name: retail_members retail_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_members
    ADD CONSTRAINT retail_members_pkey PRIMARY KEY (id);


--
-- Name: retail_orders retail_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_orders
    ADD CONSTRAINT retail_orders_pkey PRIMARY KEY (id);


--
-- Name: retail_recharge retail_recharge_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_recharge
    ADD CONSTRAINT retail_recharge_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_contracts sale_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_contracts
    ADD CONSTRAINT sale_contracts_pkey PRIMARY KEY (id);


--
-- Name: sale_customers sale_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_customers
    ADD CONSTRAINT sale_customers_pkey PRIMARY KEY (id);


--
-- Name: sale_offers sale_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_offers
    ADD CONSTRAINT sale_offers_pkey PRIMARY KEY (id);


--
-- Name: sale_out_order sale_out_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_out_order
    ADD CONSTRAINT sale_out_order_pkey PRIMARY KEY (id);


--
-- Name: sale_return_order sale_return_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_return_order
    ADD CONSTRAINT sale_return_order_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: stock_checks stock_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_checks
    ADD CONSTRAINT stock_checks_pkey PRIMARY KEY (id);


--
-- Name: stock_flow stock_flow_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_flow
    ADD CONSTRAINT stock_flow_pkey PRIMARY KEY (id);


--
-- Name: stock_inventory stock_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_inventory
    ADD CONSTRAINT stock_inventory_pkey PRIMARY KEY (id);


--
-- Name: stock_other_in stock_other_in_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_in
    ADD CONSTRAINT stock_other_in_pkey PRIMARY KEY (id);


--
-- Name: stock_other_out stock_other_out_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_out
    ADD CONSTRAINT stock_other_out_pkey PRIMARY KEY (id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id);


--
-- Name: sys_params sys_params_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params
    ADD CONSTRAINT sys_params_key_key UNIQUE (key);


--
-- Name: sys_params sys_params_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params
    ADD CONSTRAINT sys_params_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict pCWGjWoa7In1qCO3hrZOZ40ionHjMQo9kwuzKoZc01Hnn8gCYnXzduATHhj28n0

